#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';
import https from 'https';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const forceGenerate = args.includes('--force') || args.includes('-f');
const showHelp = args.includes('--help') || args.includes('-h');
const useOpenAI = args.includes('--openai') || args.includes('-o');
const debugMode = args.includes('--debug') || args.includes('-d');

// Get model from command line arguments
let modelName = 'mistral:latest'; // Default model
const modelIndex = args.findIndex((arg) => arg === '--model' || arg === '-m');
if (modelIndex !== -1 && args.length > modelIndex + 1) {
    modelName = args[modelIndex + 1];
}

// Get OpenAI API key if provided
let openaiApiKey = process.env.OPENAI_API_KEY;
const apiKeyIndex = args.findIndex((arg) => arg === '--api-key' || arg === '-k');
if (apiKeyIndex !== -1 && args.length > apiKeyIndex + 1) {
    openaiApiKey = args[apiKeyIndex + 1];
}

// Get specific post title if provided
let specificTitle = null;
const titleIndex = args.findIndex((arg) => arg === '--title' || arg === '-t');
if (titleIndex !== -1 && args.length > titleIndex + 1) {
    specificTitle = args[titleIndex + 1];
}

// Show help if requested
if (showHelp) {
    console.log(`
Blog Post Generator

Usage:
  node generate-blog-post.js [options]

Options:
  -f, --force           Force generate all pending posts regardless of scheduled date
  -m, --model <name>    Specify the Ollama model to use (default: mistral:latest)
  -t, --title <title>   Generate a specific post by title
  -o, --openai          Use OpenAI as a fallback if Ollama fails
  -k, --api-key <key>   OpenAI API key (can also be set as OPENAI_API_KEY env variable)
  -d, --debug           Enable debug mode for troubleshooting
  -h, --help            Show this help message

Description:
  This script generates blog posts based on the configuration in blog-posts-config.json.
  By default, it only generates posts that are scheduled for today or earlier.
  Use the --force option to generate all pending posts regardless of their scheduled date.
  Use the --title option to generate a specific post by title.
  Use the --openai option to use OpenAI as a fallback if Ollama fails.
`);
    process.exit(0);
}

// Attempt to import the slugify function from the correct location
let slugify;
try {
    // First try to dynamically import the module
    const commonUtils = await import('../src/utils/common-utils.js');
    slugify = commonUtils.slugify;
} catch (error) {
    // If that fails, implement a basic version
    slugify = function (input) {
        if (!input) return '';

        // make lower case and trim
        var slug = input.toLowerCase().trim();

        // remove accents from characters
        slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // replace invalid chars with spaces
        slug = slug.replace(/[^a-z0-9\s-]/g, ' ').trim();

        // replace multiple spaces or hyphens with a single hyphen
        slug = slug.replace(/[\s-]+/g, '-');

        return slug;
    };
}

// Configuration
const BLOG_DIR = path.join(__dirname, '../src/content/blog');
const POSTS_CONFIG_FILE = path.join(__dirname, './blog-posts-config.json');
const IMAGES_DIR = path.join(__dirname, '../public');

/**
 * Function to generate a date string in the format "Mon DD YYYY"
 * @returns {string} - The formatted date
 */
function getFormattedDate() {
    const date = new Date();
    const options = { month: 'short', day: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Function to test the Ollama connection
 * @param {string} modelName - The name of the model to test
 * @returns {Promise<boolean>} - A promise that resolves to true if the connection is successful
 */
async function testOllamaConnection(modelName) {
    return new Promise((resolve) => {
        console.log(`Testing Ollama connection with model: ${modelName}...`);

        // Use a simple command to check if Ollama is available
        const ollamaCheck = spawn('ollama', ['list']);

        let output = '';
        let errorOutput = '';

        ollamaCheck.stdout.on('data', (data) => {
            output += data.toString();
            if (debugMode) {
                console.log(`Ollama list output: ${data.toString()}`);
            }
        });

        ollamaCheck.stderr.on('data', (data) => {
            errorOutput += data.toString();
            if (debugMode) {
                console.error(`Ollama list error: ${data.toString()}`);
            }
        });

        ollamaCheck.on('close', (code) => {
            if (code !== 0) {
                console.error(`Ollama list command failed with code ${code}`);
                if (errorOutput) {
                    console.error(errorOutput);
                }
                resolve(false);
                return;
            }

            // Check if the model exists in the list
            if (output.includes(modelName)) {
                console.log(`Model ${modelName} found in Ollama.`);

                // Now test if we can run the model
                console.log(`Testing if model ${modelName} can run...`);
                const testPrompt = 'hello';
                const modelTest = spawn('ollama', ['run', modelName, testPrompt]);

                let modelOutput = '';
                let modelError = '';
                let timeoutId;

                modelTest.stdout.on('data', (data) => {
                    modelOutput += data.toString();
                    if (debugMode) {
                        console.log(`Model test output: ${data.toString()}`);
                    }

                    // If we get any output, consider it a success
                    if (modelOutput.length > 0) {
                        clearTimeout(timeoutId);
                        modelTest.kill();
                        console.log('Model test successful!');
                        resolve(true);
                    }
                });

                modelTest.stderr.on('data', (data) => {
                    modelError += data.toString();
                    if (debugMode) {
                        console.error(`Model test error: ${data.toString()}`);
                    }
                });

                modelTest.on('close', (modelCode) => {
                    clearTimeout(timeoutId);
                    if (modelCode !== 0 && modelCode !== null) {
                        console.error(`Model test failed with code ${modelCode}`);
                        if (modelError) {
                            console.error(modelError);
                        }
                        resolve(false);
                    } else if (modelOutput.length > 0) {
                        console.log('Model test successful!');
                        resolve(true);
                    } else {
                        console.error('Model test completed but no output was received.');
                        resolve(false);
                    }
                });

                // Set a timeout for the model test
                timeoutId = setTimeout(() => {
                    console.error('Model test timed out after 10 seconds.');
                    modelTest.kill();
                    resolve(false);
                }, 10000);
            } else {
                console.error(`Model ${modelName} not found in Ollama.`);
                console.log(`Available models: ${output.trim()}`);
                resolve(false);
            }
        });
    });
}

/**
 * Function to generate content using Ollama with exec
 * @param {string} title - The blog post title
 * @param {string[]} tags - The blog post tags
 * @returns {Promise<string>} - A promise that resolves to the generated content
 */
async function generateContentWithExec(title, tags) {
    return new Promise((resolve, reject) => {
        const prompt = `
Write a comprehensive, well-structured blog post with the title: "${title}"

The blog post should:
1. Have an engaging introduction that explains the topic.
2. Include multiple sections with detailed information.
3. Use markdown formatting with proper headings, lists, code blocks (if relevant), and emphasis.
4. Be approximately 1500-2000 words.
5. Include practical examples and best practices.
6. End with a conclusion summarizing key points.
7. Be written in a professional but conversational tone.
8. Target web developers and technology enthusiasts.
9. Include relevant information about: ${tags.join(', ')}

DO NOT include any placeholders - write complete, thoughtful content.
`;

        console.log(`Starting Ollama generation for "${title}"...`);
        console.log(`Using model: ${modelName}`);
        console.log('This may take several minutes. Please be patient...');

        // Create a temporary file for the prompt
        const tempPromptFile = path.join(__dirname, 'temp_prompt.txt');
        fs.writeFileSync(tempPromptFile, prompt);

        // Create a command that reads from the temp file
        const command = `ollama run ${modelName} < "${tempPromptFile}"`;

        if (debugMode) {
            console.log(`Executing command: ${command}`);
        }

        // Start a progress indicator
        let progressCounter = 0;
        const progressIndicators = ['|', '/', '-', '\\'];
        const progressInterval = setInterval(() => {
            process.stdout.write(`\rGenerating content... ${progressIndicators[progressCounter % 4]} (This may take several minutes)`);
            progressCounter++;
        }, 1000);

        // Execute the command
        const ollamaProcess = exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            clearInterval(progressInterval);
            process.stdout.write('\r\n'); // Move to a new line after progress indicators

            // Clean up the temp file
            try {
                fs.unlinkSync(tempPromptFile);
            } catch (err) {
                console.error(`Error deleting temp file: ${err.message}`);
            }

            if (error) {
                console.error(`\nOllama execution error: ${error.message}`);
                if (stderr) {
                    console.error(`Ollama stderr: ${stderr}`);
                }
                reject(error);
                return;
            }

            if (stderr) {
                console.error(`\nOllama stderr: ${stderr}`);
            }

            console.log(`\nContent generation completed for "${title}". Generated approximately ${stdout.split(/\s+/).length} words.`);

            // Remove any unwanted artifacts from the output
            const cleanedOutput = stdout.trim();
            resolve(cleanedOutput);
        });

        // Add a timeout to prevent hanging indefinitely
        const timeoutMinutes = 10;
        setTimeout(
            () => {
                clearInterval(progressInterval);
                console.log(`\n\nGeneration timed out after ${timeoutMinutes} minutes. Killing Ollama process...`);
                ollamaProcess.kill();

                // Clean up the temp file
                try {
                    fs.unlinkSync(tempPromptFile);
                } catch (err) {
                    console.error(`Error deleting temp file: ${err.message}`);
                }

                reject(new Error(`Ollama generation timed out after ${timeoutMinutes} minutes`));
            },
            timeoutMinutes * 60 * 1000
        ); // 10 minutes timeout
    });
}

/**
 * Function to generate content using OpenAI
 * @param {string} title - The blog post title
 * @param {string[]} tags - The blog post tags
 * @returns {Promise<string>} - A promise that resolves to the generated content
 */
async function generateContentWithOpenAI(title, tags) {
    return new Promise((resolve, reject) => {
        if (!openaiApiKey) {
            reject(new Error('OpenAI API key is required. Set it with --api-key or OPENAI_API_KEY env variable.'));
            return;
        }

        console.log(`Starting OpenAI generation for "${title}"...`);

        const prompt = `
Write a comprehensive, well-structured blog post with the title: "${title}"

The blog post should:
1. Have an engaging introduction that explains the topic.
2. Include multiple sections with detailed information.
3. Use markdown formatting with proper headings, lists, code blocks (if relevant), and emphasis.
4. Be approximately 1500-2000 words.
5. Include practical examples and best practices.
6. End with a conclusion summarizing key points.
7. Be written in a professional but conversational tone.
8. Target web developers and technology enthusiasts.
9. Include relevant information about: ${tags.join(', ')}

DO NOT include any placeholders - write complete, thoughtful content.
`;

        const data = JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional technical writer specializing in web development topics.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 4000
        });

        const options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${openaiApiKey}`,
                'Content-Length': data.length
            }
        };

        let progressCounter = 0;
        const progressIndicators = ['|', '/', '-', '\\'];
        const progressInterval = setInterval(() => {
            process.stdout.write(`\rGenerating content with OpenAI... ${progressIndicators[progressCounter % 4]}`);
            progressCounter++;
        }, 1000);

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                clearInterval(progressInterval);
                process.stdout.write('\r\n'); // Move to a new line after progress indicators

                if (res.statusCode !== 200) {
                    console.error(`OpenAI API error: ${res.statusCode}`);
                    console.error(responseData);
                    reject(new Error(`OpenAI API error: ${res.statusCode}`));
                    return;
                }

                try {
                    const parsedData = JSON.parse(responseData);
                    const content = parsedData.choices[0].message.content;
                    console.log(`\nContent generation with OpenAI completed for "${title}".`);
                    resolve(content);
                } catch (error) {
                    console.error('Error parsing OpenAI response:', error);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            clearInterval(progressInterval);
            console.error('Error with OpenAI request:', error);
            reject(error);
        });

        // Add a timeout
        req.setTimeout(60000, () => {
            clearInterval(progressInterval);
            req.destroy();
            reject(new Error('OpenAI request timed out after 60 seconds'));
        });

        req.write(data);
        req.end();
    });
}

/**
 * Function to create a blog post file
 * @param {Object} postConfig - The post configuration object
 * @returns {Promise<string>} - A promise that resolves to the file path
 */
async function createBlogPost(postConfig) {
    const { title, tags = [], isScheduled = false, scheduledDate = null } = postConfig;

    // If the post is scheduled for a future date, check if it's time to create it
    if (isScheduled && scheduledDate && !forceGenerate) {
        const scheduleTime = new Date(scheduledDate).getTime();
        const currentTime = new Date().getTime();

        if (currentTime < scheduleTime) {
            console.log(`Post "${title}" is scheduled for ${scheduledDate}, skipping for now.`);
            console.log('Use --force option to generate this post anyway.');
            return null;
        }
    }

    const slug = slugify(title);
    const filePath = path.join(BLOG_DIR, `${slug}.md`);

    // Check if the post already exists
    if (fs.existsSync(filePath)) {
        console.log(`Post "${title}" already exists, skipping.`);
        return null;
    }

    console.log(`Generating post: ${title}`);
    console.log(`Creating slug: ${slug}`);

    try {
        // Generate the content
        console.log('Starting content generation...');
        let content;
        try {
            // Use the exec version instead of spawn
            content = await generateContentWithExec(title, tags);
        } catch (error) {
            console.error(`Error generating content with Ollama: ${error.message}`);

            if (useOpenAI) {
                console.log('Falling back to OpenAI for content generation...');
                content = await generateContentWithOpenAI(title, tags);
            } else {
                throw error;
            }
        }
        console.log('Content generation successful!');

        // Create the frontmatter
        console.log('Creating frontmatter and formatting post...');

        // Extract excerpt from content (first few lines)
        const excerptText = content.split('\n').slice(0, 3).join(' ').substring(0, 150) + '...';

        // Properly quote fields that might contain special characters like colons
        const frontmatter = `---
title: "${title}"
excerpt: "${excerptText}"
publishDate: '${getFormattedDate()}'
isFeatured: false
tags:
${tags.map((tag) => `  - ${tag}`).join('\n')}
seo:
  image:
    src: '/${slug}/${slug}.webp'
    alt: "${title}"
---

![${title}](/${slug}/${slug}.webp)

${content}
`;

        // Write the file
        console.log(`Writing post to file: ${filePath}`);
        fs.writeFileSync(filePath, frontmatter);

        console.log(`Successfully generated post: ${filePath}`);
        console.log(`Post size: ${(frontmatter.length / 1024).toFixed(2)} KB`);

        // Update the post config to mark it as created
        postConfig.created = true;
        postConfig.createdDate = new Date().toISOString();

        return filePath;
    } catch (error) {
        console.error(`Error generating post "${title}":`, error);
        return null;
    }
}

/**
 * Function to save the updated posts configuration
 * @param {Array} postsConfig - The updated posts configuration
 */
function savePostsConfig(postsConfig) {
    fs.writeFileSync(POSTS_CONFIG_FILE, JSON.stringify(postsConfig, null, 2));
}

/**
 * Main function to run the blog post generation
 */
async function main() {
    console.log('Starting blog post generation...');
    console.log(`Using Ollama model: ${modelName}`);

    // Test Ollama connection first, unless in debug mode
    let connectionSuccessful = true;
    if (!debugMode) {
        connectionSuccessful = await testOllamaConnection(modelName);
        if (!connectionSuccessful) {
            console.error('Failed to connect to Ollama. Please check if Ollama is running and the model is available.');
            console.error(`Try running 'ollama list' to see available models.`);
            console.error('You can bypass this check by using the --debug option.');
            return;
        }
    } else {
        console.log('Debug mode enabled, skipping connection test.');
    }

    // Check if the posts configuration file exists
    if (!fs.existsSync(POSTS_CONFIG_FILE)) {
        // Create a sample configuration file if it doesn't exist
        const sampleConfig = [
            {
                title: 'Sample Post Title',
                tags: ['JavaScript', 'Web Development'],
                isScheduled: true,
                scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
                created: false
            }
        ];

        fs.writeFileSync(POSTS_CONFIG_FILE, JSON.stringify(sampleConfig, null, 2));
        console.log(`Created sample configuration file: ${POSTS_CONFIG_FILE}`);
        console.log('Please update it with your desired post titles and run this script again.');
        return;
    }

    // Read the posts configuration
    const postsConfig = JSON.parse(fs.readFileSync(POSTS_CONFIG_FILE, 'utf8'));

    // Filter posts that haven't been created yet
    let pendingPosts = postsConfig.filter((post) => !post.created);

    // If a specific title is provided, filter to only that post
    if (specificTitle) {
        const matchingPosts = pendingPosts.filter((post) => post.title.toLowerCase().includes(specificTitle.toLowerCase()));

        if (matchingPosts.length === 0) {
            console.log(`No pending posts found with title containing "${specificTitle}".`);
            return;
        }

        console.log(`Found ${matchingPosts.length} matching post(s) with title containing "${specificTitle}".`);
        pendingPosts = matchingPosts;
    }

    if (pendingPosts.length === 0) {
        console.log('No pending posts to generate. Add more posts to the configuration file.');
        // Create a success flag file even though no posts were created
        // This is to prevent the fallback cron jobs from running
        fs.writeFileSync(path.join(__dirname, 'success.flag'), new Date().toISOString());
        return;
    }

    console.log(`Found ${pendingPosts.length} pending posts to generate.`);
    if (forceGenerate) {
        console.log('Force generation mode enabled. Will generate all pending posts regardless of scheduled date.');
    }

    // Process each pending post
    let updatedConfig = false;
    let postsGenerated = 0;

    for (const post of pendingPosts) {
        console.log(`Checking post: ${post.title}`);

        // Log scheduled date information
        if (post.isScheduled && post.scheduledDate && !forceGenerate) {
            const scheduleTime = new Date(post.scheduledDate).getTime();
            const currentTime = new Date().getTime();

            if (currentTime < scheduleTime) {
                console.log(`Post "${post.title}" is scheduled for ${post.scheduledDate}, which is in the future. Skipping.`);
                console.log('Use --force option to generate this post anyway.');
                continue;
            }
        }

        const result = await createBlogPost(post);

        if (result) {
            updatedConfig = true;
            postsGenerated++;
        }
    }

    // Save the updated configuration if needed
    if (updatedConfig) {
        savePostsConfig(postsConfig);
        console.log('Updated posts configuration file.');
    }

    console.log(`Blog post generation completed. Generated ${postsGenerated} posts.`);

    // Create a success flag file to indicate the script ran successfully
    fs.writeFileSync(path.join(__dirname, 'success.flag'), new Date().toISOString());
    console.log('Created success flag file.');
}

// Run the main function
main().catch((error) => {
    console.error('Error in main process:', error);
    process.exit(1);
});
