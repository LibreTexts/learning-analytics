import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.css";
import { Providers } from "./providers";
import classNames from "classnames";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Learning Analytics Dashboard - LibreTexts",
  description: "Learning Analytics Dashboard - LibreTexts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={classNames(inter.className, "container mt-4 default-layout")}>
        <Providers>
          <Navbar type="instructor" />
          <div className="px-3 mt-4 ">
          {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
