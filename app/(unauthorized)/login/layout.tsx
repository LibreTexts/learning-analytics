import { Inter } from "next/font/google";
import "../../globals.css";
import "bootstrap/dist/css/bootstrap.css";
import classNames from "classnames";
import IFrameResizer from "@/components/IFrameResizer";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Course Analytics - LibreTexts ADAPT</title>
      </head>
      <body
        className={classNames(inter.className, "container mt-4 default-layout")}
      >
        <IFrameResizer />
        <div className="tw-flex tw-flex-row">
          <div className="tw-flex tw-ml-6 !tw-w-full">{children}</div>
        </div>
      </body>
    </html>
  );
}
