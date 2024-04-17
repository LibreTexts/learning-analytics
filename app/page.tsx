"use client";
import { useSelector } from "@/redux";
import InstructorDashboard from "@/components/InstructorDashboard";
import StudentDashboard from "@/components/StudentDashboard";

export default function Dashboard() {
  const globalSettings = useSelector((state) => state.globalSettings);

  return globalSettings.viewAs === "instructor" ? (
    <InstructorDashboard />
  ) : (
    <StudentDashboard student_id={globalSettings.studentId} />
  );
}
