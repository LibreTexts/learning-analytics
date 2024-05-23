'use client'
import { useGlobalContext } from "@/state/globalContext";
import axios from "axios";
import { useEffect } from "react";

interface SessionToContextProviderProps {
  children: React.ReactNode;
}

const SessionToContextProvider: React.FC<SessionToContextProviderProps> = ({
  children,
}) => {
  const [globalState, setGlobalState] = useGlobalContext();

  useEffect(() => {
    fetchSessionData();
  }, []);

  async function fetchSessionData() {
    const res = await axios.get("/api/auth/session");
    if (!res.data?.user) return;
    setGlobalState({
      ...res.data.user,
      courseID: res.data.user.courses[0] ?? "",
      viewAs: res.data.user.role,
    });
  }

  return <>{children}</>;
};

export default SessionToContextProvider;