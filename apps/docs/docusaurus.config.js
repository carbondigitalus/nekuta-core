// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require('prism-react-renderer');
const lightCodeTheme = themes.github;
// nightOwl's own background (#011627) is a genuine navy, unlike dracula's
// grayish-purple (#282a36) — keeps code blocks consistent with the rest of
// the dark theme instead of reading as a different, grayer surface.
const darkCodeTheme = themes.nightOwl;

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: 'Nekuta',
    tagline: 'Intuitive state management for React.',
    favicon: 'img/logo/nekuta-logo.png',

    // Set the production url of your site here
    url: 'https://docs.nekuta.org',
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: '/',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'jared-leddy', // Usually your GitHub org/user name.
    projectName: 'nekuta-core', // Usually your repo name.

    onBrokenLinks: 'throw',
    markdown: {
        hooks: { onBrokenMarkdownLinks: 'warn' }
    },

    headTags: [
        {
            tagName: 'link',
            attributes: {
                rel: 'preconnect',
                href: 'https://fonts.googleapis.com'
            }
        },
        {
            tagName: 'link',
            attributes: {
                rel: 'preconnect',
                href: 'https://fonts.gstatic.com',
                crossorigin: 'anonymous'
            }
        },
        {
            tagName: 'link',
            attributes: {
                rel: 'stylesheet',
                href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'
            }
        }
    ],

    // Even if you don't use internalization, you can use this field to set useful
    // metadata like html lang. For example, if your site is Chinese, you may want
    // to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en']
    },

    presets: [
        [
            '@docusaurus/preset-classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                debug: process.env.NODE_ENV === 'development',
                docs: {
                    path: 'docs',
                    routeBasePath: 'docs',
                    sidebarPath: require.resolve('./sidebars.js'),
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        'https://github.com/jared-leddy/nekuta-core/edit/main/apps/docs/'
                },
                theme: {
                    customCss: require.resolve('./src/css/style.scss')
                }
            })
        ]
    ],
    plugins: [
        // object is required, even if it's empty
        ['docusaurus-plugin-sass', {}]
    ],
    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            metadata: [
                { name: 'og:title', content: 'Nekuta' },
                { name: 'og:type', content: 'website' },
                { name: 'og:url', content: 'https://docs.nekuta.org/' },
                { name: 'og:site_name', content: 'Nekuta' },
                {
                    name: 'og:description',
                    content:
                        'Intuitive state management for React. Type-safe. Predictable. Class-first.'
                },
                { name: 'og:email', content: 'hello@nekuta.org' },
                { name: 'og:locality', content: 'Charlotte' },
                { name: 'og:region', content: 'NC' },
                { name: 'og:country-name', content: 'USA' },
                { name: 'twitter:card', content: 'summary_large_image' },
                { name: 'twitter:site', content: '@NekutaStore' },
                { name: 'twitter:creator', content: '@NekutaStore' }
            ],
            image: 'img/nekuta-social.png',
            colorMode: {
                defaultMode: 'dark',
                respectPrefersColorScheme: false
            },
            navbar: {
                title: 'Nekutā',
                logo: {
                    alt: 'Nekuta Logo',
                    src: 'img/logo/nekuta-logo.svg'
                },
                items: [
                    {
                        type: 'doc',
                        docId: 'intro',
                        position: 'left',
                        label: 'Docs'
                    },
                    {
                        href: 'https://github.com/jared-leddy/nekuta-core',
                        label: 'GitHub',
                        position: 'right'
                    }
                ]
            },
            footer: {
                style: 'dark',
                links: [
                    {
                        title: 'Docs',
                        items: [
                            {
                                label: 'Website',
                                to: '/docs/intro'
                            }
                        ]
                    },
                    {
                        title: 'More',
                        items: [
                            {
                                label: 'GitHub',
                                href: 'https://github.com/jared-leddy/nekuta-core'
                            }
                        ]
                    }
                ],
                copyright: `Copyright &copy; 2026-${new Date().getFullYear()} &middot; Nekuta &middot; All Rights Reserved.`
            },
            prism: {
                theme: lightCodeTheme,
                darkTheme: darkCodeTheme
            }
        })
};

module.exports = config;
