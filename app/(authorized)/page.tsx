"use client";
import InstructorDashboard from "@/components/InstructorDashboard";
import StudentDashboard from "@/components/StudentDashboard";
import { IUser_Raw } from "@/lib/models/user";
import { globalStateAtom } from "@/state/globalState";
import axios from "axios";
import { useAtom } from "jotai";
import { useEffect } from "react";

export default function Dashboard() {
  const [globalState, setGlobalState] = useAtom(globalStateAtom);

  useEffect(() => {
    async function fetchData() {
      const res = await axios.get("/api/auth/session");
      if (!res.data?.user) return;
      updateStateFromSession(res.data.user);
    }
    fetchData();
  }, []);

  function updateStateFromSession(userData: IUser_Raw) {
    setGlobalState((prev) => ({
      ...prev,
      role: userData?.role,
      viewAs: userData?.role,
      courseID: userData?.courses[0] || "",
    }));
  }

  if (globalState.viewAs === "instructor") {
    return <InstructorDashboard course_id={globalState.courseID} />;
  }
  return <StudentDashboard course_id={globalState.courseID} />;
}
