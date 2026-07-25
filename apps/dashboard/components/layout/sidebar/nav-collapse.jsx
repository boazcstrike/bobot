"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import NavItem from "./nav-item";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

function isActiveRoute(item, pathname) {
  if (item.url && pathname === item.url) return true;
  if (item.items) return item.items.some((child) => isActiveRoute(child, pathname));
  return false;
}

export default function NavCollapse({ menu, className, badges = {} }) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <>
      {menu.map((section, sectionIndex) => (
        <div key={section.heading ?? sectionIndex}>
          {section.heading ? (
            <span
              className={cn(
                "mb-2 block text-xs font-semibold uppercase text-muted-foreground transition-all duration-200",
                isCollapsed && "text-center group-hover:text-start group-data-[state=expanded]:text-start",
              )}
            >
              {isCollapsed ? (
                <>
                  <span className="group-hover:hidden group-data-[state=expanded]:hidden">...</span>
                  <span className="hidden group-hover:inline group-data-[state=expanded]:inline">
                    {section.heading}
                  </span>
                </>
              ) : (
                section.heading
              )}
            </span>
          ) : null}

          {section.items?.map((item) => {
            const hasChildren = Array.isArray(item.items) && item.items.length > 0;
            const active = isActiveRoute(item, pathname);

            if (!hasChildren) {
              return (
                <Link
                  key={item.id}
                  href={item.url || "#"}
                  target={item.external ? "_blank" : undefined}
                  className={cn("flex items-center gap-3 rounded-md transition-all duration-200 ease-in-out", className)}
                >
                  <NavItem
                    item={item}
                    hasChildren={false}
                    isActive={active}
                    badgeContent={badges[item.id]}
                  />
                </Link>
              );
            }

            return (
              <details key={item.id} className="group/nav" open={active}>
                <summary className="flex cursor-pointer items-center rounded-md transition-all duration-200 ease-in-out">
                  <NavItem
                    item={item}
                    hasChildren
                    className={className}
                    isActive={pathname === item.url}
                  />
                </summary>

                <div className="ml-5 border-l border-border pl-3">
                  {item.items.map((child) => (
                    <Link
                      key={child.id}
                      href={child.url || "#"}
                      target={child.external ? "_blank" : undefined}
                      className={cn("block rounded-md transition-all duration-200 ease-in-out", className)}
                    >
                      <NavItem
                        item={child}
                        hasChildren={false}
                        className="my-1! px-2! py-1!"
                        isActive={pathname === child.url}
                        badgeContent={badges[child.id]}
                      />
                    </Link>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      ))}
    </>
  );
}
