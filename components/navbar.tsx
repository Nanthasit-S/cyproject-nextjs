// fixcy/components/navbar.tsx
import { useState, useEffect } from "react";
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenuToggle,
  NavbarBrand,
} from "@heroui/navbar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";
import NextLink from "next/link";
import clsx from "clsx";

import { ThemeSwitch } from "@/components/theme-switch";
import { Logo, MailOutlineIcon, MailFilledIcon } from "@/components/icons";
import { useAuth } from "@/lib/AuthContext";



// Icons
const SettingsIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l-.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

const LogoutIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);

const ImagesIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
);
const TableIcon = ({ size = 20 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"><path fill="currentColor" d="M16.59 10H20v2h-3.41l-2.71 4.52A5.013 5.013 0 0113 22H2v-2h11a3 3 0 002.82-4.17L13.2 12H9V2h2v8h2.2l2.6-4.55A3 3 0 0013 2H2v2h11a1.2 1.2 0 011.04.6L16.59 10z"/></svg>;
const CalendarIcon = ({ size = 20 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"><path fill="currentColor" d="M19 19H5V8h14m-3-7v2H8V1H6v2H5c-1.11 0-2 .89-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2h-1V1m-1 11h-5v5h5v-5z"/></svg>;
const MailIcon = ({ size = 20 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5l-8-5V6l8 5l8-5v2z"/></svg>;


export const Navbar = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
        const fetchCount = async () => {
            try {
                const res = await fetch('/api/notifications/unread-count');
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.unreadCount);
                }
            } catch (error) {
                console.error("Failed to fetch unread count", error);
            }
        };
        fetchCount();
        
        const interval = setInterval(fetchCount, 60000);
        return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const InboxIconWithBadge = () => (
    <div className="relative">
      <MailIcon />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-2 w-4 h-4 text-xs flex items-center justify-center bg-danger text-white rounded-full">
          {unreadCount}
        </span>
      )}
    </div>
  );

  return (
    <HeroUINavbar
      maxWidth="xl"
      position="sticky"
      className={clsx(
        "transition-all duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit">ACME</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
        as="div"
      >
        <div className="hidden lg:flex gap-4 justify-start mr-auto">
        </div>
        
        <div className="hidden sm:flex items-center gap-3">
          <ThemeSwitch />

          {!loading && (
            <>
              {isAuthenticated && user ? (
                <div className="flex items-center gap-4">
                  <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                      <Avatar
                        isBordered
                        as="button"
                        className="transition-transform"
                        color="default"
                        size="sm"
                        src={user.pictureUrl}
                      />
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Profile Actions" variant="flat">
                        <DropdownSection title="Actions" showDivider>
                            <DropdownItem key="booking" href="/booking" startContent={<CalendarIcon />}>
                                Book a Table
                            </DropdownItem>
                            <DropdownItem key="inbox" href="/inbox" startContent={<InboxIconWithBadge />}>
                                Inbox
                            </DropdownItem>
                            {user.role === "admin" ? (
                                <DropdownItem key="images" href="/admin/images" startContent={<ImagesIcon />}>
                                    Manage Images
                                </DropdownItem>
                            ) : null}
                            {user.role === "admin" ? (
                                <DropdownItem key="management" href="/admin/management" startContent={<TableIcon />}>
                                    Establishment Mgmt
                                </DropdownItem>
                            ) : null}
                        </DropdownSection>
                        <DropdownSection title="Account">
                            <DropdownItem key="profile" href="/profile" startContent={<SettingsIcon />}>
                                My Profile
                            </DropdownItem>
                            <DropdownItem key="logout" color="danger" onPress={logout} startContent={<LogoutIcon />}>
                                Log Out
                            </DropdownItem>
                        </DropdownSection>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              ) : null}
            </>
          )}
        </div>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>
    </HeroUINavbar>
  );
};