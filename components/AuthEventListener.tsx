"use client";
import { useEffect } from "react";

const AuthEventListener = () => {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      //   if (event.origin !== "https://parent-app-url.com") return;
      if (event.data.type === "AUTH_TOKEN") {
        const token = event.data.token;
        console.log(token);
        // Handle the token (e.g., save to local storage, send to server, etc.)
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return null; // This component does not render anything
};

export default AuthEventListener;
