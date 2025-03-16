#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import readline from 'readline';
import { fileURLToPath } from 'url';
import os from 'os';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Get the absolute path to the generate-blog-post.js script
const scriptPath = path.resolve(__dirname, 'generate-blog-post.js');
const projectRoot = path.resolve(__dirname, '..');

console.log('\n==== Automated Blog Post Generator Setup ====\n');
console.log('This script will help you set up automated blog post generation based on your configuration.');
console.log('You can choose between a cron job (runs on schedule) or a login item (runs when your Mac starts up).\n');

// Check if the script exists and is executable
if (!fs.existsSync(scriptPath)) {
    console.error(`Error: The generate-blog-post.js script does not exist at ${scriptPath}`);
    process.exit(1);
}

// Make sure the script is executable
try {
    fs.accessSync(scriptPath, fs.constants.X_OK);
} catch (error) {
    console.log('Making the script executable...');
    execSync(`chmod +x ${scriptPath}`);
}

// Function to set up the cron job
function setupCronJob() {
    console.log('\nSetting up cron job...');

    // Check if crontab is available
    try {
        execSync('command -v crontab', { stdio: 'ignore' });
    } catch (error) {
        console.error('Error: crontab command is not available on your system.');
        process.exit(1);
    }

    // Check current crontab entries
    let currentCrontab = '';
    try {
        currentCrontab = execSync('crontab -l', { encoding: 'utf8' });
    } catch (error) {
        // No crontab for the user
        currentCrontab = '';
    }

    // Create the cron job entries
    // Run on Friday at 1pm, with fallback times at 2pm, 3pm, 4pm, 5pm, and 6pm
    const logFile = path.join(projectRoot, 'scripts', 'blog-generator.log');
    const cronEntries = [
        `0 13 * * 5 cd ${projectRoot} && ${scriptPath} >> ${logFile} 2>&1 || echo "Job failed at 1pm" >> ${logFile}`,
        `0 14 * * 5 [ ! -f ${projectRoot}/scripts/success.flag ] && cd ${projectRoot} && ${scriptPath} >> ${logFile} 2>&1 || echo "Job failed at 2pm" >> ${logFile}`,
        `0 15 * * 5 [ ! -f ${projectRoot}/scripts/success.flag ] && cd ${projectRoot} && ${scriptPath} >> ${logFile} 2>&1 || echo "Job failed at 3pm" >> ${logFile}`,
        `0 16 * * 5 [ ! -f ${projectRoot}/scripts/success.flag ] && cd ${projectRoot} && ${scriptPath} >> ${logFile} 2>&1 || echo "Job failed at 4pm" >> ${logFile}`,
        `0 17 * * 5 [ ! -f ${projectRoot}/scripts/success.flag ] && cd ${projectRoot} && ${scriptPath} >> ${logFile} 2>&1 || echo "Job failed at 5pm" >> ${logFile}`,
        `0 18 * * 5 [ ! -f ${projectRoot}/scripts/success.flag ] && cd ${projectRoot} && ${scriptPath} >> ${logFile} 2>&1 || echo "Job failed at 6pm" >> ${logFile}`,
        `1 18 * * 5 rm -f ${projectRoot}/scripts/success.flag`
    ].join('\n');

    // Check if any entry for the blog generator already exists
    if (currentCrontab.includes(scriptPath)) {
        console.log('A cron job for the blog generator already exists. Updating it...');

        // Replace the existing entries
        const lines = currentCrontab.split('\n');
        const newLines = lines.filter((line) => !line.includes(scriptPath));
        newLines.push(cronEntries);

        // Update crontab
        const newCrontab = newLines.join('\n') + '\n';
        fs.writeFileSync('/tmp/crontab-temp', newCrontab);
        execSync('crontab /tmp/crontab-temp');
        fs.unlinkSync('/tmp/crontab-temp');
    } else {
        // Add the new entries
        const newCrontab = currentCrontab + cronEntries + '\n';
        fs.writeFileSync('/tmp/crontab-temp', newCrontab);
        execSync('crontab /tmp/crontab-temp');
        fs.unlinkSync('/tmp/crontab-temp');
    }

    console.log('Cron job set up successfully!');
    console.log(`The blog generator will run every Friday at 1:00 PM.`);
    console.log(`If the 1:00 PM run fails, the script will retry at 2:00 PM, 3:00 PM, 4:00 PM, 5:00 PM, and 6:00 PM.`);
    console.log(`Log output will be saved to: ${logFile}`);
}

// Function to set up a macOS launch agent
function setupMacOSLaunchAgent() {
    console.log('\nSetting up macOS Launch Agent...');

    // Check if we're on macOS
    if (process.platform !== 'darwin') {
        console.error('Error: This feature is only available on macOS.');
        return false;
    }

    // Create the LaunchAgents directory if it doesn't exist
    const launchAgentsDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
    if (!fs.existsSync(launchAgentsDir)) {
        fs.mkdirSync(launchAgentsDir, { recursive: true });
    }

    // Create a unique identifier for the launch agent
    const launchAgentId = 'com.blogGenerator.startup';
    const plistPath = path.join(launchAgentsDir, `${launchAgentId}.plist`);

    // Create the log file path
    const logFile = path.join(projectRoot, 'scripts', 'blog-generator.log');

    // Create the plist file content
    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${launchAgentId}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>${scriptPath}</string>
        <string>--force</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>${projectRoot}</string>
    <key>StandardOutPath</key>
    <string>${logFile}</string>
    <key>StandardErrorPath</key>
    <string>${logFile}</string>
    <key>StartInterval</key>
    <integer>86400</integer>
</dict>
</plist>`;

    // Write the plist file
    fs.writeFileSync(plistPath, plistContent);

    // Load the launch agent
    try {
        execSync(`launchctl load ${plistPath}`);
        console.log('Launch Agent set up successfully!');
        console.log(`The blog generator will run when you log in to your Mac.`);
        console.log(`It will also run once every 24 hours after login.`);
        console.log(`Log output will be saved to: ${logFile}`);
        return true;
    } catch (error) {
        console.error('Error loading the Launch Agent:', error.message);
        console.log('You may need to manually load it with:');
        console.log(`launchctl load ${plistPath}`);
        return false;
    }
}

// Function to test the blog generator
function testBlogGenerator() {
    console.log('\nTesting the blog generator...');
    console.log('Running: node ' + scriptPath);
    console.log('--------------------------------------------------');

    return new Promise((resolve, reject) => {
        const process = spawn('node', [scriptPath], { stdio: 'inherit' });

        process.on('close', (code) => {
            console.log('--------------------------------------------------');
            if (code === 0) {
                console.log('Test completed successfully!');
                resolve();
            } else {
                console.error(`Test failed with exit code ${code}`);
                reject(new Error(`Test failed with exit code ${code}`));
            }
        });
    });
}

// Main function
async function main() {
    try {
        // Ask if the user wants to test the generator first
        rl.question('Would you like to test the blog generator before setting up automation? (y/n): ', async (answer) => {
            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                try {
                    await testBlogGenerator();
                } catch (error) {
                    console.error('Error during testing:', error.message);
                    rl.question('Do you still want to proceed with setting up automation? (y/n): ', (answer) => {
                        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                            askSetupType();
                        } else {
                            console.log('Setup canceled. Please fix the issues and try again.');
                            rl.close();
                        }
                    });
                    return;
                }
            }

            askSetupType();
        });

        function askSetupType() {
            console.log('\nPlease choose how you want to automate the blog post generation:');
            console.log('1. Cron job (runs on schedule - every Friday at 1:00 PM)');
            console.log('2. macOS Login Item (runs when your Mac starts up)');

            rl.question('Enter your choice (1 or 2): ', (answer) => {
                if (answer === '1') {
                    setupCronJob();
                    rl.close();
                } else if (answer === '2') {
                    if (process.platform !== 'darwin') {
                        console.error('Error: macOS Login Item is only available on macOS.');
                        rl.question('Do you want to set up a cron job instead? (y/n): ', (answer) => {
                            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                                setupCronJob();
                            } else {
                                console.log('Setup canceled.');
                            }
                            rl.close();
                        });
                    } else {
                        setupMacOSLaunchAgent();
                        rl.close();
                    }
                } else {
                    console.log('Invalid choice. Please enter 1 or 2.');
                    askSetupType();
                }
            });
        }
    } catch (error) {
        console.error('Error:', error.message);
        rl.close();
        process.exit(1);
    }
}

// Run the main function
main();
