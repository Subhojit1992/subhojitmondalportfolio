import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import AstroPWA from '@vite-pwa/astro';

// https://astro.build/config
export default defineConfig({
    site: 'https://subhojit.me',
    integrations: [
        mdx(),
        sitemap(),
        tailwind({
            applyBaseStyles: false
        }),
        AstroPWA({
            registerType: 'autoUpdate',
            injectRegister: 'inline',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}']
            },
            manifest: {
                theme_color: '#F2F1EC',
                background_color: '#171717',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                name: 'Subhojit Mondal',
                short_name: 'Subhojit Mondal',
                description: "I'm Subhojit Mondal, a seasoned Frontend Technical Lead, bringing over a decade of expertise",
                includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
                icons: [
                    {
                        src: '/android-chrome-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/icon-256x256.png',
                        sizes: '256x256',
                        type: 'image/png'
                    },
                    {
                        src: '/icon-384x384.png',
                        sizes: '384x384',
                        type: 'image/png'
                    },
                    {
                        src: '/android-chrome-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: '/maskable-icon.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            }
        })
    ]
});
