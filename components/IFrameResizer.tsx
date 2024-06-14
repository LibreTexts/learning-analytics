// @ts-nocheck
"use client";
import { useEffect } from "react";
import "iframe-resizer/js/iframeResizer.contentWindow";

export default function IFrameResizer() {
  useEffect(() => {
    if(!window) {
      console.log('[LAD]: no window')
      return
    }
    if (!window.iFrameResizer) {
      console.log('[LAD]: rendered but no iFrameResizer')
      return
    }
    window.iFrameResizer = {
      onMessage: function (message) {
        // alert("Got message from parent");
        // console.log("message", message);
      },
    };
  }, []);

  return <></>;
}
