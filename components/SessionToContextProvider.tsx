"use client";
import Loading from "@/app/(authorized)/loading";
import { getCourseAnalyticsSettings } from "@/lib/analytics-functions";
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

  useEffect(() => {
    fetchCourseSettings();
  }, [globalState.courseID]);

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

  async function fetchCourseSettings() {
    try {
      if (!globalState.courseID) return;
      const res = await getCourseAnalyticsSettings(globalState.courseID);
      if (!res) return;
      setGlobalState((prev) => ({
        ...prev,
        shareGradeDistribution: res.shareGradeDistribution,
        frameworkExclusions: res.frameworkExclusions,
        assignmentExclusions: res.assignmentExclusions,
      }));
    } catch (err) {
      console.error(err);
    }
  }

  return <Suspense fallback={<Loading />}>{children}</Suspense>;
};

export default SessionToContextProvider;
