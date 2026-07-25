"use client";

import { PanelLeft } from "lucide-react";

import LightDark from "./light-dark";
import Notifications from "./notifications";
import Profile from "./profile";
import Search from "./search";
import FullLogo from "@/components/layout/shared/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";

export default function Header({ onOpenSettings }) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-2 border-b border-border bg-background">
      <nav>
        <div className="mx-auto flex flex-wrap items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <div className="block lg:hidden">
              <FullLogo />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer rounded-full p-2 transition hover:bg-primary/5"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <PanelLeft size={21} />
            </Button>

            <Separator
              orientation="vertical"
              className="ml-2 mr-4 h-4 w-px self-center bg-border max-lg:hidden"
            />

            <div className="hidden sm:block">
              <Search />
            </div>
          </div>

          <div className="flex items-center gap-0 sm:gap-1">
            <LightDark />
            <Notifications className="hidden sm:block" />
            <Profile onOpenSettings={onOpenSettings} />
          </div>
        </div>
      </nav>
    </header>
  );
}
