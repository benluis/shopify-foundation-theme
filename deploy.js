#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  sourceDir: './shopify',
  distRepoPath: '../aeris-theme',
  distRepoUrl: 'https://github.com/benluis/aeris-theme.git',
  buildCommand: 'npm run webpack:build',
  productionBranch: 'production'
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
    log('\n Starting Theme Preparation', 'bright');
    log('================================', 'bright');

    // Step 1: Build the theme
    log('\n Building theme...', 'yellow');
    run(CONFIG.buildCommand);
    log(' Theme built successfully!', 'green');

    // Step 2: Check if dist directory exists
    const distRepoExists = await fs.pathExists(CONFIG.distRepoPath);
    
    if (!distRepoExists) {
      log('\n Creating distribution directory...', 'yellow');
      await fs.ensureDir(CONFIG.distRepoPath);
      log(' Distribution directory created!', 'green');
    } else {
      log('\n Using existing distribution directory...', 'yellow');
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
    log('\n Copying theme files...', 'yellow');
    await fs.copy(CONFIG.sourceDir, CONFIG.distRepoPath);
    log(' Files copied successfully!', 'green');

    // Step 5: Set up git repository and production branch
    const gitExists = await fs.pathExists(path.join(CONFIG.distRepoPath, '.git'));
    if (!gitExists) {
      log('\n🔧 Initializing git repository...', 'yellow');
      run('git init', CONFIG.distRepoPath);
      run(`git remote add origin ${CONFIG.distRepoUrl}`, CONFIG.distRepoPath);
      log(' Git repository initialized!', 'green');
    }

    // Step 6: Configure git user for automated commits
    log('\n🔧 Configuring git user...', 'yellow');
    run('git config user.name "Aeris Theme Deploy"', CONFIG.distRepoPath, true);
    run('git config user.email "deploy@aeris-theme.com"', CONFIG.distRepoPath, true);

    // Step 7: Create or switch to production branch
    log(`\n🌿 Setting up ${CONFIG.productionBranch} branch...`, 'yellow');
    const branchExists = run(`git show-ref --verify --quiet refs/heads/${CONFIG.productionBranch}`, CONFIG.distRepoPath, true);

    if (!branchExists) {
      log(` Creating new ${CONFIG.productionBranch} branch...`, 'yellow');
      run(`git checkout -b ${CONFIG.productionBranch}`, CONFIG.distRepoPath);
    } else {
      log(` Switching to existing ${CONFIG.productionBranch} branch...`, 'yellow');
      run(`git checkout ${CONFIG.productionBranch}`, CONFIG.distRepoPath);
    }
    log(` Successfully switched to ${CONFIG.productionBranch} branch!`, 'green');

    // Step 8: Add and commit changes
    log('\n💾 Committing theme changes...', 'yellow');
    run('git add .', CONFIG.distRepoPath);

    // Check if there are changes to commit
    const hasChanges = !run('git diff --staged --quiet', CONFIG.distRepoPath, true);
    if (hasChanges) {
      const commitMessage = `Update Aeris theme - ${new Date().toISOString()}`;
      run(`git commit -m "${commitMessage}"`, CONFIG.distRepoPath);
      log(' Changes committed successfully!', 'green');

      // Step 9: Push to production branch
      log(`\n🚀 Pushing to ${CONFIG.productionBranch} branch...`, 'yellow');
      try {
        run(`git push origin ${CONFIG.productionBranch}`, CONFIG.distRepoPath);
        log(` Successfully pushed to ${CONFIG.productionBranch} branch!`, 'green');
      } catch (error) {
        log('\n⚠️  Push failed - this might be the first push to the remote branch', 'yellow');
        log(' You may need to push manually or set up the remote branch first:', 'yellow');
        log(` git push -u origin ${CONFIG.productionBranch}`, 'cyan');
      }
    } else {
      log('ℹ️  No changes to commit', 'blue');
    }

    // Step 10: Success message
    log('\n🎉 Theme Deployment Complete!', 'bright');
    log('================================', 'bright');
    log(`✅ Successfully deployed to ${CONFIG.productionBranch} branch!`, 'green');
    log(`\n📁 Distribution directory: ${CONFIG.distRepoPath}`, 'cyan');
    log(`🔗 Remote repository: ${CONFIG.distRepoUrl}`, 'cyan');
    log(`🌿 Branch: ${CONFIG.productionBranch}`, 'cyan');
    log('\n📋 What was deployed:', 'yellow');
    log('  • Built theme assets (CSS, JS)', 'white');
    log('  • Shopify theme files from ./shopify/ directory', 'white');
    log('  • All sections, templates, and configuration', 'white');
    log('\n🔄 Next deployment:', 'yellow');
    log('  Simply run this script again to update the production branch', 'white');
    log('  Previous deployments will be preserved in git history', 'white');

  } catch (error) {
    log('\n Theme preparation failed!', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Run deployment
deployTheme();
