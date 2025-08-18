#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  sourceDir: './shopify',
  distRepoPath: '../aeris-foundation-theme-dist',
  distRepoUrl: 'https://github.com/yourusername/aeris-foundation-theme-dist.git', // Update this!
  buildCommand: 'npm run webpack:build',
  commitMessage: 'Auto-deploy: Theme update'
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

function run(command, cwd = process.cwd()) {
  try {
    log(`Running: ${command}`, 'cyan');
    execSync(command, { 
      cwd, 
      stdio: 'inherit'
    });
  } catch (error) {
    log(`Error running command: ${command}`, 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

async function deployTheme() {
  try {
    log('\n🚀 Starting Theme Deployment', 'bright');
    log('================================', 'bright');

    // Step 1: Build the theme
    log('\n📦 Building theme...', 'yellow');
    run(CONFIG.buildCommand);
    log('✅ Theme built successfully!', 'green');

    // Step 2: Check if dist repo exists
    const distRepoExists = await fs.pathExists(CONFIG.distRepoPath);
    
    if (!distRepoExists) {
      log('\n📁 Creating distribution repository...', 'yellow');
      
      // Create directory
      await fs.ensureDir(CONFIG.distRepoPath);
      
      // Initialize git repo
      run('git init', CONFIG.distRepoPath);
      run(`git remote add origin ${CONFIG.distRepoUrl}`, CONFIG.distRepoPath);
      
      log('✅ Distribution repository created!', 'green');
    } else {
      log('\n🔄 Updating existing distribution repository...', 'yellow');
      
      // Pull latest changes
      run('git pull origin main', CONFIG.distRepoPath);
    }

    // Step 3: Clear existing files (except .git)
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

    // Step 5: Commit and push changes
    log('\n📤 Committing and pushing changes...', 'yellow');
    
    // Add all files
    run('git add .', CONFIG.distRepoPath);
    
    // Check if there are changes to commit
    try {
      run('git diff --staged --quiet', CONFIG.distRepoPath);
      log('ℹ️  No changes to deploy', 'blue');
      return;
    } catch {
      // There are changes, continue with commit
    }
    
    // Commit with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const commitMessage = `${CONFIG.commitMessage} - ${timestamp}`;
    run(`git commit -m "${commitMessage}"`, CONFIG.distRepoPath);
    
    // Push to main branch
    run('git push origin main', CONFIG.distRepoPath);
    
    log('✅ Changes pushed to distribution repository!', 'green');

    // Step 6: Success message
    log('\n🎉 Deployment Complete!', 'bright');
    log('================================', 'bright');
    log('Your theme has been successfully deployed to the distribution repository.', 'green');
    log('You can now connect this repo to Shopify\'s GitHub integration.', 'green');
    log(`\nDistribution repo: ${CONFIG.distRepoUrl}`, 'cyan');

  } catch (error) {
    log('\n❌ Deployment failed!', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Run deployment
deployTheme();
