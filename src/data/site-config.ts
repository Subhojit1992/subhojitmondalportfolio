export type Image = {
    src: string;
    alt?: string;
    caption?: string;
};

export type Link = {
    text: string;
    href: string;
};

export type Hero = {
    title?: string;
    text?: string;
    image?: Image;
    actions?: Link[];
};

export type Subscribe = {
    title?: string;
    text?: string;
    formUrl: string;
};

export type SiteConfig = {
    logo?: Image;
    title: string;
    subtitle?: string;
    description: string;
    image?: Image;
    headerNavLinks?: Link[];
    footerNavLinks?: Link[];
    socialLinks?: Link[];
    hero?: Hero;
    subscribe?: Subscribe;
    postsPerPage?: number;
    projectsPerPage?: number;
};

const siteConfig: SiteConfig = {
    title: 'Subhojit.',
    subtitle: '< frontend developer />',
    description: 'Over 10 years plus of experience in frontend developer Subhojit Mondal',
    image: {
        src: '/hero.jpeg',
        alt: 'Subhojit Mondal - Technical Lead, proficient in React, Vue, and Angular with a focus on Frontend Development.'
    },
    headerNavLinks: [
        {
            text: 'Home',
            href: '/'
        },
        // {
        //     text: 'Projects',
        //     href: '/projects'
        // },
        {
            text: 'Blog',
            href: '/blog'
        },
        {
            text: 'Tags',
            href: '/tags'
        },
        {
            text: 'Contact',
            href: '/contact'
        }
    ],
    footerNavLinks: [
        // {
        //     text: 'About',
        //     href: '/about'
        // },
        // {
        //     text: 'Contact',
        //     href: '/contact'
        // },
    ],
    socialLinks: [
        {
            text: 'Github',
            href: 'https://github.com/Subhojit1992/'
        },
        {
            text: 'Linkedin',
            href: 'https://www.linkedin.com/in/subhojit1992/'
        }
    ],
    hero: {
        title: 'Hi There & Welcome to My Corner of the Web!',
        text: "Greetings, I'm **Subhojit Mondal**, a seasoned Frontend Technical Lead, bringing over a decade of expertise to Capital Numbers Infotech Pvt. Ltd. My proficiency spans React, Vue, Angular, and Node, allowing me to craft seamless user experiences. My approach to projects involves a blend of intuition, strategic research, and a keen eye for aesthetics, resulting in the development of top-notch software.<br /><br />Driven by a deep appreciation for visual design, I meticulously adhere to the principles of product-led growth, ensuring our creations not only meet but exceed expectations. Delve into my coding journey on <a href='https://github.com/Subhojit1992/'>GitHub</a>, where you can explore some of my notable endeavors. Connect with me on <a href='https://www.linkedin.com/in/subhojit1992/'>Linkedin</a> for a more in-depth conversation about my contributions and experiences in the dynamic realm of web development. Let's collaborate and innovate together!",
        image: {
            src: '/hero.jpeg',
            alt: 'Black and white image of Subhojit'
        },
        actions: [
            {
                text: 'Get in Touch',
                href: '/contact'
            }
        ]
    },
    subscribe: {
        title: "Subscribe to Subhojit's Newsletter",
        text: 'One update per week. All the latest posts directly in your inbox.',
        formUrl: '#'
    },
    postsPerPage: 8,
    projectsPerPage: 8
};

export default siteConfig;
