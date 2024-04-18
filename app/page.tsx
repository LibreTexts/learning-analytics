"use client";
import InstructorDashboard from "@/components/InstructorDashboard";
import StudentDashboard from "@/components/StudentDashboard";
import { globalStateAtom } from "@/state/globalState";
import { useAtom } from "jotai";

const Dashboard = () => {
  const [globalState] = useAtom(globalStateAtom);

  if (globalState.viewAs === "instructor") {
    return <InstructorDashboard />;
  }
  return <StudentDashboard />;
};
export default Dashboard;
