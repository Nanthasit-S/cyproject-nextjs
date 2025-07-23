// fixcy/pages/_app.tsx
import type { AppProps } from "next/app";
import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useRouter } from "next/router";
import { AuthProvider } from "@/lib/AuthContext";
import { fontSans, fontMono } from "@/config/fonts";
import "@/styles/globals.css";

// vvvvvvvvvvvvvv CHANGE IS HERE vvvvvvvvvvvvvv
import { NotificationProvider } from "@/lib/NotificationContext";
import { NotificationModal } from "@/components/NotificationModal";
// ^^^^^^^^^^^^^^ CHANGE IS HERE ^^^^^^^^^^^^^^

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <NotificationProvider>
            <Component {...pageProps} />
            <NotificationModal />
          </NotificationProvider>
        </AuthProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}

export const fonts = {
  sans: fontSans.style.fontFamily,
  mono: fontMono.style.fontFamily,
};