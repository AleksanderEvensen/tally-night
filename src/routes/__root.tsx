import { ClientOnly, HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";
import type { QueryClient } from "@tanstack/react-query";
import { AppBootstrap } from "#/components/app-bootstrap";
import { AppSync } from "#/components/app-sync";

interface MyRouterContext {
  queryClient: QueryClient;
}

function ThemeHandler() {
  var stored = window.localStorage.getItem("theme");
  var mode = stored === "light" || stored === "dark" || stored === "auto" ? stored : "auto";
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var resolved = mode === "auto" ? (prefersDark ? "dark" : "light") : mode;
  var root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

const THEME_INIT_SCRIPT = `(function(){try{ ${ThemeHandler.toString()} }catch(e){}})`;

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Unlucky BAC",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans">
        <TanStackQueryProvider>
          <ClientOnly
            fallback={
              <main className="grid min-h-screen place-items-center bg-background px-4 text-sm text-muted-foreground">
                Loading app…
              </main>
            }
          >
            <AppBootstrap />
            {children}
            <AppSync />
          </ClientOnly>
          <TanStackDevtools
            config={{
              position: "bottom-right",
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        </TanStackQueryProvider>
        <Scripts />
      </body>
    </html>
  );
}
