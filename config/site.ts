export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Next.js + HeroUI",
  description: "Make beautiful websites regardless of your design experience.",
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Book a Table",
      href: "/booking",
    },
    {
      label: "Image Management",
      href: "/admin/images",
    },
    {
      label: "Establishment Mgmt",
      href: "/admin/management",
    },
    {
      label: "Help & Feedback",
      href: "/help-feedback",
    },
    {
      label: "Logout",
      href: "/api/auth/logout",
    },
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};