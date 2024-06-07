"use client";
import Loading from "@/app/(authorized)/loading";
import { useGlobalContext } from "@/state/globalContext";
import axios from "axios";
import { Suspense, useEffect } from "react";

interface SessionToContextProviderProps {
  children: React.ReactNode;
}

const SessionToContextProvider: React.FC<SessionToContextProviderProps> = ({
  children,
}) => {
  const [globalState, setGlobalState] = useGlobalContext();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const sessionData = await fetchSessionData();
    if (!sessionData?.courseID) return;
    fetchLetterGradesReleased();
  }

  async function fetchSessionData() {
    const res = await axios.get("/api/auth/session");
    if (!res.data?.user) return;

    const toSet = {
      ...globalState,
      role: res.data.user.role,
      courseID: res.data.user.courses[0] ?? "",
      viewAs: res.data.user.role,
    };

    setGlobalState(toSet);
    return toSet;
  }

  async function fetchLetterGradesReleased() {
    try {
      const res = await axios.get(
        `/api/courses?course_id=${globalState.courseID}`
      );
      if (!res.data?.data) return;
      setGlobalState((prev) => ({
        ...prev,
        courseLetterGradesReleased:
          res.data?.data?.letter_grades_released ?? false,
      }));
    } catch (error) {
      console.error(error);
    }
  }

  return <Suspense fallback={<Loading />}>{children}</Suspense>;
};

export default SessionToContextProvider;
