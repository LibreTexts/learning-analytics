"use client";
import InstructorDashboard from "@/components/InstructorDashboard";
import StudentDashboard from "@/components/StudentDashboard";
import { Suspense, useEffect } from "react";
import Loading from "./loading";
import { useGlobalContext } from "@/state/globalContext";
import { getHasData } from "@/lib/analytics-functions";

export default function Dashboard() {
  const [globalState, setGlobalState] = useGlobalContext();

  useEffect(() => {
    if (globalState.courseID) {
      getHasData(globalState.courseID).then((data) => {
        setGlobalState((prev) => ({ ...prev, hasData: data }));
      });
    }
  }, [globalState.courseID]);

  return (
    <Suspense fallback={<Loading />}>
      {globalState.viewAs === "instructor" ? (
        <InstructorDashboard
          course_id={globalState.courseID}
          letter_grades_released={globalState.courseLetterGradesReleased}
          has_data={globalState.hasData}
        />
      ) : (
        <StudentDashboard course_id={globalState.courseID} student_id={globalState.student.id} has_data={globalState.hasData} />
      )}
    </Suspense>
  );
}
