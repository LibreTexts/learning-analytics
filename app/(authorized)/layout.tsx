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
import dynamic from "next/dynamic";
const IFrameResizer = dynamic(() => import("@/components/IFrameResizer"), {
  ssr: false,
});

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
      <body className={classNames(inter.className, "mt-4 default-layout")}>
        <IFrameResizer />
        <Providers>
          <SessionToContextProvider>
            <div className="tw-flex tw-flex-row tw-items-center tw-justify-center">
              {process.env.NODE_ENV === "development" && <DemoModeControls />}
            </div>
            <div className="tw-grid tw-grid-flow-col tw-gap-6 tw-grid-cols-[208px_auto]">
              <NavMenu />
              {children}
            </div>
          </SessionToContextProvider>
        </Providers>
      </body>
    </html>
  );
}
