#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  sourceDir: './shopify',
  distRepoPath: '../aeris-theme',
  distRepoUrl: 'https://github.com/benluis/aeris-theme.git',
  buildCommand: 'npm run webpack:build'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function run(command, cwd = process.cwd(), allowFailure = false) {
  try {
    log(`Running: ${command}`, 'cyan');
    execSync(command, { 
      cwd, 
      stdio: 'inherit'
    });
    return true;
  } catch (error) {
    if (allowFailure) {
      return false;
    }
    log(`Error running command: ${command}`, 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

async function deployTheme() {
  try {
    log('\n🚀 Starting Theme Preparation', 'bright');
    log('================================', 'bright');

    // Step 1: Build the theme
    log('\n📦 Building theme...', 'yellow');
    run(CONFIG.buildCommand);
    log('✅ Theme built successfully!', 'green');

    // Step 2: Check if dist directory exists
    const distRepoExists = await fs.pathExists(CONFIG.distRepoPath);
    
    if (!distRepoExists) {
      log('\n📁 Creating distribution directory...', 'yellow');
      await fs.ensureDir(CONFIG.distRepoPath);
      log('✅ Distribution directory created!', 'green');
    } else {
      log('\n🔄 Using existing distribution directory...', 'yellow');
    }

    // Step 3: Clear existing files (except .git if it exists)
    log('\n🧹 Cleaning distribution directory...', 'yellow');
    const distFiles = await fs.readdir(CONFIG.distRepoPath);
    for (const file of distFiles) {
      if (file !== '.git') {
        await fs.remove(path.join(CONFIG.distRepoPath, file));
      }
    }

    // Step 4: Copy built theme files
    log('\n📋 Copying theme files...', 'yellow');
    await fs.copy(CONFIG.sourceDir, CONFIG.distRepoPath);
    log('✅ Files copied successfully!', 'green');

    // Step 5: Initialize git if needed (but don't push)
    const gitExists = await fs.pathExists(path.join(CONFIG.distRepoPath, '.git'));
    if (!gitExists) {
      log('\n🔧 Initializing git repository...', 'yellow');
      run('git init', CONFIG.distRepoPath);
      run(`git remote add origin ${CONFIG.distRepoUrl}`, CONFIG.distRepoPath);
      log('✅ Git repository initialized!', 'green');
    }

    // Step 6: Stage files (but don't commit)
    log('\n📦 Staging files for commit...', 'yellow');
    run('git add .', CONFIG.distRepoPath);
    
    // Check if there are changes to commit
    const noChanges = run('git diff --staged --quiet', CONFIG.distRepoPath, true);
    if (noChanges) {
      log('ℹ️  No changes to stage', 'blue');
    } else {
      log('✅ Files staged and ready for commit!', 'green');
    }

    // Step 7: Success message
    log('\n🎉 Theme Preparation Complete!', 'bright');
    log('================================', 'bright');
    log('Your theme files are ready for deployment!', 'green');
    log(`\n📁 Distribution directory: ${CONFIG.distRepoPath}`, 'cyan');
    log(`🔗 Remote repository: ${CONFIG.distRepoUrl}`, 'cyan');
    log('\n📝 Next steps:', 'yellow');
    log('  1. Navigate to the distribution directory', 'white');
    log('  2. Review the staged changes: git status', 'white');
    log('  3. Commit the changes: git commit -m "Update theme"', 'white');
    log('  4. Push to GitHub: git push origin main', 'white');
    log('\n💡 Or run these commands:', 'yellow');
    log(`cd "${CONFIG.distRepoPath}"`, 'cyan');
    log('git status', 'cyan');
    log('git commit -m "Update theme"', 'cyan');
    log('git push origin main', 'cyan');

  } catch (error) {
    log('\n❌ Theme preparation failed!', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Run deployment
deployTheme();
