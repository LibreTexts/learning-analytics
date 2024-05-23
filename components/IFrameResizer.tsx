"use client";
import { useEffect } from "react";
import "@iframe-resizer/child";

interface IFrameResizerProps {}

const IFrameResizer: React.FC<IFrameResizerProps> = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.iFrameResizer = {
      onMessage: function (message: any) {
        console.log("iFrameResizer message:", message);
      },
    };
  }, []);

  return <></>;
};

export default IFrameResizer;
