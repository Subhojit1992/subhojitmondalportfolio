# AI Blog Post Generator

This folder contains scripts to automate blog post generation using AI for your Astro website.

## How it Works

1. You define a list of blog post titles and scheduled dates in the `blog-posts-config.json` file
2. The generator script (`generate-blog-post.js`) checks this file every Friday and creates blog posts when it's time
3. The posts are generated using Ollama's LLaMA3 model
4. Generated posts are placed in the `src/content/blog/` directory with proper frontmatter
5. Posts are marked as "created" in the config file once they're generated

## Prerequisites

- Node.js (v14 or later)
- Ollama installed and available on your system PATH
- LLaMA3 model pulled in Ollama (`ollama pull llama3`)

## Files

- `generate-blog-post.js` - The main script that generates blog posts
- `blog-posts-config.json` - Configuration file with post titles and schedules
- `setup-cron.js` - Script to set up automated weekly generation via cron
- `blog-generator.log` - Log file for scheduled runs (created after first run)
- `success.flag` - Temporary file created when generation succeeds

## Setup Instructions

### 1. Configure Blog Posts

Edit the `blog-posts-config.json` file to add your planned blog post titles:

```json
[
  {
    "title": "Your Blog Post Title",
    "tags": ["Tag1", "Tag2"],
    "isScheduled": true,
    "scheduledDate": "2025-03-05T00:00:00Z",
    "created": false
  }
  // Add more posts here
]
```

### 2. Test the Generator

Run the generator manually to make sure it works:

```bash
node scripts/generate-blog-post.js
```

### 3. Set Up Automated Generation

Run the setup script to create a cron job:

```bash
node scripts/setup-cron.js
```

This will set up a job that runs every Friday at 1:00 PM to check for and generate scheduled posts. If the 1:00 PM run fails, the script will automatically retry at 2:00 PM, 3:00 PM, 4:00 PM, 5:00 PM, and 6:00 PM.

## Customization

You can modify the `generate-blog-post.js` script to:

- Change the AI prompt for better blog posts
- Adjust the generated frontmatter
- Use a different Ollama model
- Change how image paths are handled
- Modify the scheduling logic

## Troubleshooting

If posts aren't being generated:

1. Check the `blog-generator.log` file for errors
2. Verify that Ollama is installed and working (`ollama list`)
3. Make sure the LLaMA3 model is available (`ollama list`)
4. Ensure the cron job is set up properly (`crontab -l`)
5. Try running the script manually to see if there are any issues
