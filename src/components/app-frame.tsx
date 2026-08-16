import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, UserRound } from "lucide-react";

import { useAppState } from "#/hooks/use-app-state";
import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "#/components/ui/sheet";

const navItems = [
  { to: "/", label: "Tracker" },
  { to: "/groups", label: "Groups" },
  { to: "/profile", label: "Profile" },
  { to: "/privacy", label: "Privacy" },
];

export function AppFrame({
  children,
  title,
  description,
  backHref,
  actions,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  backHref?: string;
  actions?: ReactNode;
}) {
  const { userProfile } = useAppState();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(219,39,119,0.14),transparent_24rem),radial-gradient(circle_at_bottom,rgba(249,115,22,0.16),transparent_24rem)] px-3 py-4 sm:px-4">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="hidden lg:flex lg:flex-col lg:gap-4">
          <div className="rounded-[2rem] border border-border/70 bg-card/85 p-5 shadow-sm backdrop-blur">
            <p className="font-heading text-2xl tracking-tight">Unlucky BAC</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Mobile-first party tracker with private local logs and optional group sharing.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.to}
                  render={<Link to={item.to} />}
                  variant="ghost"
                  className="h-9 justify-start rounded-xl px-3 text-sm"
                >
                  {item.label}
                </Button>
              ))}
            </div>
            {userProfile ? (
              <div className="mt-8 rounded-2xl bg-muted/70 p-3">
                <p className="text-sm font-medium">{userProfile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {userProfile.weightInKg} kg · {userProfile.gender}
                </p>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0">
          <header className="mb-4 flex items-center justify-between gap-3 rounded-[1.6rem] border border-border/70 bg-card/85 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex min-w-0 items-center gap-3">
              {backHref ? (
                <Button
                  render={<Link to={backHref} />}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  Back
                </Button>
              ) : (
                <Sheet>
                  <SheetTrigger
                    render={
                      <Button variant="outline" size="icon-sm" className="rounded-full lg:hidden" />
                    }
                  >
                    <Menu />
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[88vw] max-w-sm border-r border-border/70 bg-card"
                  >
                    <SheetHeader>
                      <SheetTitle>Unlucky BAC</SheetTitle>
                      <SheetDescription>Tracker, groups, and privacy controls.</SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col gap-2 px-6 pb-6">
                      {navItems.map((item) => (
                        <Button
                          key={item.to}
                          render={<Link to={item.to} />}
                          variant="ghost"
                          className="h-10 justify-start rounded-xl px-3 text-sm"
                        >
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              <div className="min-w-0">
                <p className="truncate font-heading text-xl tracking-tight">
                  {title ?? "Unlucky BAC"}
                </p>
                {description ? (
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">{description}</p>
                ) : null}
              </div>
            </div>

            <div className={cn("flex items-center gap-2", actions ? "" : "lg:gap-3")}>
              {actions}
              <Button
                render={<Link to="/profile" />}
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
              >
                <UserRound />
              </Button>
            </div>
          </header>

          <div className="rounded-[2rem] border border-border/70 bg-card/82 shadow-sm backdrop-blur">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
