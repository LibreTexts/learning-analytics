"use client";
import InstructorDashboard from "@/components/InstructorDashboard";
import StudentDashboard from "@/components/StudentDashboard";
import { Suspense } from "react";
import Loading from "./loading";
import { useGlobalContext } from "@/state/globalContext";

export default function Dashboard() {
  const [globalState] = useGlobalContext();

  return (
    <Suspense fallback={<Loading />}>
      {globalState.viewAs === "instructor" ? (
        <InstructorDashboard course_id={globalState.courseID} />
      ) : (
        <StudentDashboard course_id={globalState?.courseID ?? ""} />
      )}
    </Suspense>
  );
}
