"use client";
import InstructorDashboard from "@/components/InstructorDashboard";
import StudentDashboard from "@/components/StudentDashboard";
import { Suspense, useEffect, useState } from "react";
import Loading from "./loading";
import { useGlobalContext } from "@/state/globalContext";
import axios from "axios";

export default function Dashboard() {
  const [globalState] = useGlobalContext();
  const [letterGradesReleased, setLetterGradesReleased] = useState(false);

  useEffect(() => {
    if(!globalState.courseID) return;
    fetchLetterGradesReleased();
  }, [globalState.courseID]);

  async function fetchLetterGradesReleased() {
    try {
      const res = await axios.get(`/api/courses?course_id=${globalState.courseID}`);
      setLetterGradesReleased(res.data?.data?.letter_grades_released ?? false);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Suspense fallback={<Loading />}>
      {globalState.viewAs === "instructor" ? (
        <InstructorDashboard
          course_id={globalState.courseID}
          letter_grades_released={letterGradesReleased}
        />
      ) : (
        <StudentDashboard course_id={globalState?.courseID ?? ""} />
      )}
    </Suspense>
  );
}
