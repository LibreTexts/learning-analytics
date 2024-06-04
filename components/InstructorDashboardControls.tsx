"use client";
import { Card, Dropdown } from "react-bootstrap";
import CustomDropdown from "./CustomDropdown";
import { truncateString } from "@/utils/text-helpers";

import { getAssignments, getStudents } from "@/lib/analytics-functions";
import { useQuery } from "@tanstack/react-query";
import { IDWithName } from "@/lib/types";
import { useEffect, useMemo, useRef } from "react";
import { useGlobalContext } from "@/state/globalContext";

const InstructorDashboardControls = () => {
  const [globalState, setGlobalState] = useGlobalContext();
  const elementRef = useRef<HTMLDivElement>(null);

  const { data: students, status: studentsStatus } = useQuery<IDWithName[]>({
    queryKey: ["students", globalState.courseID, globalState.ferpaPrivacy],
    queryFn: fetchStudents,
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });

  const { data: assignments, status: assignmentsStatus } = useQuery<
    IDWithName[]
  >({
    queryKey: ["assignments", globalState.courseID],
    queryFn: fetchAssignments,
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    // Set the selected ID to the first student when the list is loaded
    if (students && students.length > 0) {
      updateSelectedStudent(students[0].id);
    }
  }, [students]);

  useEffect(() => {
    // Set the selected ID to the first assignment when the list is loaded
    if (assignments && assignments.length > 0) {
      updateSelectedAssignment(assignments[0].id);
    }
  }, [assignments]);

  async function fetchStudents(): Promise<IDWithName[]> {
    try {
      if (!globalState.courseID) return [];
      const data = await getStudents(
        globalState.courseID,
        1,
        100,
        globalState.ferpaPrivacy
      );
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async function fetchAssignments(): Promise<IDWithName[]> {
    try {
      if (!globalState.courseID) return [];
      const data = await getAssignments(globalState.courseID);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  const updateSelectedStudent = (id: string) => {
    setGlobalState({ ...globalState, studentId: id });
  };

  const updateSelectedAssignment = (id: string) => {
    setGlobalState({ ...globalState, assignmentId: id });
  };

  const selectedStudentPretty = useMemo(() => {
    if (!globalState.studentId) return "";
    const found = students?.find((s) => s.id === globalState.studentId)?.name;
    return found ? truncateString(found, 20) : "Unknown";
  }, [globalState.studentId, students]);

  const selectedAssignmentPretty = useMemo(() => {
    if (!globalState.assignmentId) return "";
    const found = assignments?.find(
      (a) => a.id === globalState.assignmentId
    )?.name;
    return found ? truncateString(found, 20) : "Unknown";
  }, [globalState.assignmentId, assignments]);

  const StudentDropdown = () => (
    <CustomDropdown
      icon="person"
      label={globalState.studentId ? selectedStudentPretty : "Select Student"}
      loading={studentsStatus === "pending"}
      drop="up"
    >
      {students?.map((s) => (
        <Dropdown.Item key={s.id} onClick={() => updateSelectedStudent(s.id)}>
          {truncateString(s.name, 20)}
        </Dropdown.Item>
      ))}
    </CustomDropdown>
  );

  const AssignmentDropdown = () => (
    <CustomDropdown
      icon="file"
      label={
        globalState.assignmentId
          ? selectedAssignmentPretty
          : "Select Assignment"
      }
      loading={assignmentsStatus === "pending"}
      className="tw-ml-4"
      drop="up"
    >
      {assignments?.map((a) => (
        <Dropdown.Item key={a.id} onClick={() => updateSelectedAssignment(a.id)}>
          {a.name}
        </Dropdown.Item>
      ))}
    </CustomDropdown>
  );

  return (
    <Card
      className="tw-mt-4 tw-rounded-lg tw-shadow-md tw-px-4 tw-pt-1 tw-pb-2 tw-max-w-[40rem]"
      style={{
        position: "fixed",
        bottom: "1rem",
        zIndex: 1000,
      }}
      ref={elementRef}
    >
      <p className="tw-font-semibold tw-text-lg tw-text-center tw-mb-1 tw-mt-0">
        Filters
      </p>
      <div className="tw-flex tw-flex-row">
        <StudentDropdown />
        <AssignmentDropdown />
      </div>
    </Card>
  );
};

export default InstructorDashboardControls;
