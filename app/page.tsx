'use client'
import InstructorDashboard from "@/components/InstructorDashboard";
import StudentDashboard from "@/components/StudentDashboard";
import { useSelector } from "@/redux";

export default async function Dashboard() {
  const globalSettings = useSelector((state) => state.globalSettings);

  return globalSettings.viewAs === "instructor" ? (
    <InstructorDashboard />
  ) : (
    <StudentDashboard student_id={globalSettings.viewAs} />
  );
}
