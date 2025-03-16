# Subhojit Mondal Blog

## Features

- Personal blog built with Astro
- Tailwind CSS for styling
- Markdown content for blog posts
- Mobile-responsive design
- PWA support
- AI-powered automated blog post generation

## Automated Blog Post Generation

This project includes a system to automatically generate blog posts using AI (Ollama with LLaMA3). You can schedule posts to be generated on specific dates by defining post titles in advance.

### How to Use the Blog Automation

1. Define your post titles and scheduled dates in `scripts/blog-posts-config.json`
2. Run the generator manually: `node scripts/generate-blog-post.js`
3. Set up automated weekly generation: `node scripts/setup-cron.js`

The system is set up to run every Friday at 1:00 PM, with automatic retries at 2:00, 3:00, 4:00, 5:00, and 6:00 PM if earlier attempts fail.

Check out the [automation documentation](scripts/README.md) for more details and customization options.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Build for production: `npm run build`

## License

This project is licensed under the terms found in the LICENSE file.
