// @ts-nocheck
import { useEffect } from "react";

export default function IFrameResizer() {
  useEffect(() => {
    if(!window) {
      console.warn('[LAD]: no window')
      return
    }
    if (!window.iFrameResizer) {
      console.warn('[LAD]: rendered but no iFrameResizer')
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
