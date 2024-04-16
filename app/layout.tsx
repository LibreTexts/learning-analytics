"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.css";
import { Providers } from "./providers";
import classNames from "classnames";
import NavMenu from "@/components/NavMenu";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import DemoModeControls from "@/components/DemoModeControls";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <head>
        <title>Course Analytics - LibreTexts ADAPT</title>
      </head>
      <body
        className={classNames(inter.className, "container mt-4 default-layout")}
      >
        <Providers>
          <>
            {process.env.NODE_ENV === "development" && (
              <div className="tw-flex tw-flex-row tw-items-center tw-justify-center">
                <DemoModeControls />
              </div>
            )}
            <div className="tw-flex tw-flex-row">
              <div className="tw-flex tw-flex-col">
                <NavMenu activeKey={pathname} />
              </div>
              <div className="tw-flex tw-ml-6 !tw-w-full">{children}</div>
            </div>
          </>
        </Providers>
      </body>
    </html>
  );
}
