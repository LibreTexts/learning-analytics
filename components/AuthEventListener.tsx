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
    if (originMatch && event.origin !== originMatch) return;
    if (event.data.type === "AUTH_TOKEN") {
      const token = event.data.token;
      {
        debug && console.log(token);
      }
      const success = await adaptLogin(token);
      if (success) {
        {
          debug && console.log("Login successful, redirecting to home page");
        }
        return router.push("/");
      }
    }
  }

  return null; // This component does not render anything
};

export default AuthEventListener;
