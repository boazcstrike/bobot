"use client";

import Link from "next/link";
import { ChartColumn, CreditCard, GitFork, Mailbox, Settings, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const USER = {
  name: "Boaz Sze",
  email: "boaz@mindyou.com.ph",
  avatar: "",
  initials: "BS",
};

const PROFILE_LINKS = [
  { title: "Expense Dashboard", href: "/expense-dashboard", icon: ChartColumn },
  { title: "Credit Card Statements", href: "/credit-card-statements", icon: CreditCard },
  { title: "Personal GitHub Repos", href: "/personal-github-repos", icon: GitFork },
];

export default function Profile({ onOpenSettings }) {
  return (
    <Sheet>
      <SheetTrigger
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full outline-none hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Open profile panel"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={USER.avatar} alt={USER.name} />
          <AvatarFallback>{USER.initials}</AvatarFallback>
        </Avatar>
      </SheetTrigger>

      <SheetContent
        showCloseButton={false}
        side="right"
        className="max-w-60 border-s-0 sm:max-w-80"
      >
        <SheetClose className="absolute end-5 top-5 rounded-full p-2 hover:bg-primary/5 hover:text-primary">
          <X size={20} />
          <span className="sr-only">Close</span>
        </SheetClose>

        <div className="p-6 py-6">
          <div className="flex flex-col items-center justify-center gap-4 pt-10">
            <Avatar className="h-16 w-16">
              <AvatarImage src={USER.avatar} alt={USER.name} />
              <AvatarFallback>{USER.initials}</AvatarFallback>
            </Avatar>

            <div className="text-center">
              <SheetTitle className="text-lg font-semibold">{USER.name}</SheetTitle>
              <div className="flex items-center justify-center gap-2">
                <Mailbox size={18} className="text-muted-foreground" />
                <span className="text-sm font-normal text-muted-foreground">{USER.email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border">
          <ul className="flex flex-col gap-2 p-6">
            {PROFILE_LINKS.map((item) => (
              <li key={item.href} className="group">
                <Link
                  href={item.href}
                  className="flex gap-3 rounded-md px-3 py-2 text-muted-foreground group-hover:bg-primary/5"
                >
                  <item.icon width={20} height={20} className="group-hover:text-primary" />
                  <span className="text-sm group-hover:text-primary">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <SheetFooter className="px-0 pb-6">
          <div className="w-full border-t border-border">
            <div className="flex flex-col items-center justify-center gap-3 rounded-sm pt-6">
              <div className="text-center">
                <h5 className="text-xl font-semibold">Dashboard settings</h5>
                <p className="text-sm text-muted-foreground">Color scheme and workspace</p>
              </div>

              <Button variant="secondary" onClick={onOpenSettings}>
                <Settings />
                Open settings
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
