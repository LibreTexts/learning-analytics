"use client";
import { Card, Dropdown } from "react-bootstrap";
import CustomDropdown from "./CustomDropdown";
import { truncateString } from "@/utils/text-helpers";

import { getAssignments, getStudents } from "@/lib/analytics-functions";
import { useQuery } from "@tanstack/react-query";
import { IDWithName, Student } from "@/lib/types";
import { useEffect, useMemo, useRef } from "react";
import { useGlobalContext } from "@/state/globalContext";
import classNames from "classnames";

const InstructorDashboardControls = ({ className }: { className?: string }) => {
  const [globalState, setGlobalState] = useGlobalContext();
  const elementRef = useRef<HTMLDivElement>(null);

  const { data: students, status: studentsStatus } = useQuery<Student[]>({
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
      updateSelectedStudent(students[0]);
    }
  }, [students]);

  useEffect(() => {
    // Set the selected ID to the first assignment when the list is loaded
    if (assignments && assignments.length > 0) {
      updateSelectedAssignment(assignments[0].id);
    }
  }, [assignments]);

  async function fetchStudents(): Promise<Student[]> {
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

  const updateSelectedStudent = (newStudent: Student) => {
    setGlobalState({ ...globalState, student: newStudent });
  };

  const updateSelectedAssignment = (id: string) => {
    setGlobalState({ ...globalState, assignmentId: id });
  };

  const selectedStudentPretty = useMemo(() => {
    // if (!globalState.student.id) return "";
    // const found = students?.find((s) => s.id === globalState.studentId)?.name;

    const found = globalState.student.name;
    return found ? truncateString(found, 20) : "Unknown";
  }, [globalState.student, students]);

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
      label={globalState.student.id ? selectedStudentPretty : "Select Student"}
      loading={studentsStatus === "pending"}
      drop="down"
      labelLength={12}
      toggleClassName="!tw-w-44 !tw-p-1 !tw-overflow-x-hidden"
    >
      {students?.map((s) => (
        <Dropdown.Item key={s.id} onClick={() => updateSelectedStudent(s)}>
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
      drop="down"
      labelLength={15}
      className="tw-mt-2"
      toggleClassName="!tw-w-44 !tw-p-1 !tw-overflow-x-hidden"
    >
      {assignments?.map((a) => (
        <Dropdown.Item
          key={a.id}
          onClick={() => updateSelectedAssignment(a.id)}
          className="!tw-p-2"
        >
          {a.name}
        </Dropdown.Item>
      ))}
    </CustomDropdown>
  );

  return (
    <Card
      className={classNames(
        "tw-mt-4 tw-rounded-lg tw-shadow-sm tw-px-4 tw-pt-1 tw-pb-2 tw-z-50",
        className
      )}
      ref={elementRef}
    >
      <p className="tw-font-semibold tw-text-lg tw-text-center tw-mb-1 tw-mt-0">
        Filters
      </p>
      <div className="tw-flex tw-flex-col">
        <p className="tw-text-sm tw-text-gray-500 tw-mt-0 tw-mb-2">
          Select a student and assignment to view their respective data.
        </p>
        <StudentDropdown />
        <AssignmentDropdown />
      </div>
    </Card>
  );
};

export default InstructorDashboardControls;
