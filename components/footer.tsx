// fixcy/components/footer.tsx
import { Link } from "@heroui/link";
import { GithubIcon, TwitterIcon, DiscordIcon, HeartFilledIcon, Logo } from "@/components/icons";
import { siteConfig } from "@/config/site";

export const Footer = () => {
  return (
    <footer className="w-full flex items-center justify-center py-8 border-t border-divider bg-background/60 backdrop-blur-md">
      <div className="container max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 px-6">
        <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-default-600">
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <p className="font-bold">ACME</p>
          </div>
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} ACME Inc. All rights reserved.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link isExternal href={siteConfig.links.twitter} aria-label="Twitter">
            <TwitterIcon className="text-default-500 hover:text-primary transition-colors" />
          </Link>
          <Link isExternal href={siteConfig.links.discord} aria-label="Discord">
            <DiscordIcon className="text-default-500 hover:text-primary transition-colors" />
          </Link>
          <Link isExternal href={siteConfig.links.github} aria-label="GitHub">
            <GithubIcon className="text-default-500 hover:text-primary transition-colors" />
          </Link>
        </div>
      </div>
    </footer>
  );
};