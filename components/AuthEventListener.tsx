"use client";
import { adaptLogin } from "@/lib/auth-functions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const AuthEventListener = ({ debug = false, originMatch }: { debug?: boolean, originMatch?: string }) => {
  const router = useRouter();

  useEffect(() => {
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  async function handleMessage(event: MessageEvent) {
    if (originMatch && event.origin !== originMatch) {
      console.error(`Origin ${event.origin} does not match expected value: ${originMatch}`);
    }

    if (event.data.type !== "AUTH_TOKEN") return
    const token = event.data.token;

    if (debug) console.log("Received token from parent window: ", token);

    const success = await adaptLogin(token);
    if (success) {
      if (debug) console.log("Login successful, redirecting to home page");
      return router.push("/");
    }
  }

  return null; // This component does not render anything
};

export default AuthEventListener;
