import { Inter } from "next/font/google";
import "../globals.css";
import "bootstrap/dist/css/bootstrap.css";
import { Providers } from "./providers";
import classNames from "classnames";
import NavMenu from "@/components/NavMenu";
import DemoModeControls from "@/components/DemoModeControls";
import { validateRequest } from "@/lib/auth";
import { redirect } from "next/navigation";
import SessionToContextProvider from "@/components/SessionToContextProvider";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await validateRequest();
  if (!user) {
    redirect("/login");
  }

  return (
    <html lang="en">
      <head>
        <title>Course Analytics - LibreTexts ADAPT</title>
      </head>
      <body
        className={classNames(inter.className, "container mt-4 default-layout")}
      >
        <Providers>
          <SessionToContextProvider>
            {process.env.NODE_ENV === "development" && (
              <div className="tw-flex tw-flex-row tw-items-center tw-justify-center">
                <DemoModeControls />
              </div>
            )}
            <div className="tw-flex tw-flex-row">
              <div className="tw-flex tw-flex-col">
                <NavMenu />
              </div>
              <div className="tw-flex tw-ml-6 !tw-w-full">{children}</div>
            </div>
          </SessionToContextProvider>
        </Providers>
      </body>
    </html>
  );
}
