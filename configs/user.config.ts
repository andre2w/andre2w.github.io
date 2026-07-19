import type { UserConfig } from "../src/site.config";

const userConfig: UserConfig = {
  title: "Andre Torres",
  description: "Sometimes I write things",

  url: "https://andre2w.github.io",
  author: "",

  logo: "/logo.svg",
  avatar: "/avatar.png",

  navigation: [
    { title: "Writing", url: "/posts" },
    { title: "Archive", url: "/archive" },
    { title: "About", url: "/about" },
  ],

  footerLinks: [
    { title: "RSS", url: "/rss.xml" },
    { title: "Archive", url: "/archive" },
    { title: "Source", url: "https://github.com/andre2w/andre2w.github.io" },
  ],

  social: [
    {
      title: "LinkedIn",
      url: "https://www.linkedin.com/in/andreguelfitorres/",
      icon: "linkedin",
    },
  ],

  footerCredits: "Designed for reading. Built with Astro & Lipi",

  postsPerPage: 8,
  recentPosts: 6,
  relatedPosts: 4,

  showThemeToggle: true,
  showReadingTime: true,

  heroVariant: "studio",

  annotation: "Take care",
};

export default userConfig;
