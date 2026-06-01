"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  Settings,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const DEFAULT_USER = {
  name: "Boaz Sze",
  email: "boaz@mindyou.com.ph",
  avatar: "",
};

function initialsOf(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const SETTINGS_HREF = "/?settings=1&settingsTab=personalization";

export default function NavUser({ user = DEFAULT_USER, onOpenSettings }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const initials = initialsOf(user.name);

  const confirmSignOut = useCallback(() => {
    setSignOutOpen(false);
    router.push("/");
  }, [router]);

  // On the home page the settings modal is wired via onOpenSettings; on
  // other pages fall back to navigating home with the settings query.
  const openSettings = useCallback(() => {
    if (onOpenSettings) onOpenSettings();
    else router.push(SETTINGS_HREF);
  }, [onOpenSettings, router]);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground"
                />
              }
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={8}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <BadgeCheck />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openSettings}>
                  <Settings />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setSignOutOpen(true)}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {signOutOpen && (
        <div
          className="signout-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-title"
          onClick={() => setSignOutOpen(false)}
        >
          <div
            className="signout-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="rail-icon rail-icon-danger signout-dialog-icon" aria-hidden="true">
              <LogOut size={22} />
            </span>
            <h2 id="signout-title">Sign out?</h2>
            <p>You&apos;ll be returned to the dashboard home. Save any unsaved work first.</p>
            <div className="signout-actions">
              <button
                type="button"
                className="signout-cancel interactive focus-ring"
                onClick={() => setSignOutOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="signout-confirm interactive focus-ring"
                onClick={confirmSignOut}
                autoFocus
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
