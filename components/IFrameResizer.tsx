// @ts-nocheck
"use client";
import { useEffect } from "react";
import "iframe-resizer/js/iframeResizer.contentWindow";

export default function IFrameResizer() {
  useEffect(() => {
    if(!window) {
      console.log('no window')
    }
    if (!window.iFrameResizer) {
      console.log('rendered but no iFrameResizer')
    }
    console.log('rendered with iFrameResizer')
    window.iFrameResizer = {
      onMessage: function (message) {
        alert("Got message from parent");
        console.log("message", message);
      },
    };
  }, []);

  return <></>;
}
