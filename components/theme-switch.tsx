import { FC, useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@heroui/button";
import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";

export interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  if (!isMounted) {
    return <div className="w-10 h-10 rounded-lg bg-default-200 animate-pulse" />;
  }

  return (
    <Button
      isIconOnly
      aria-label={theme === 'light' ? "Switch to dark mode" : "Switch to light mode"}
      className={className}
      size="md"
      variant="ghost"
      onPress={toggleTheme}
    >
      {theme === "light" ? (
        <MoonFilledIcon size={22} />
      ) : (
        <SunFilledIcon size={22} />
      )}
    </Button>
  );
};