import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.css";
import BootstrapClient from "@/components/BootstrapClient";
import { Providers } from "./providers";
import classNames from "classnames";

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
      <body className={classNames(inter.className, "container mt-4")}>
        <Providers>{children}</Providers>
        <BootstrapClient />
      </body>
    </html>
  );
}
