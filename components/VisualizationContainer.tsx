"use client";
import React, { cloneElement, useEffect, useMemo, useState } from "react";
import { Card, Dropdown } from "react-bootstrap";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CustomDropdown from "./CustomDropdown";
import { truncateString } from "@/utils/text-helpers";
import { getAssignments, getStudents } from "@/lib/analytics-functions";
import { IDWithName } from "@/lib/types";
import { useAtom } from "jotai";
import { globalStateAtom } from "@/state/globalState";

interface VisualizationContainerProps {
  title: string;
  description: string;
  dropdown?: "student" | "assignment";
  children: React.ReactNode;
  studentMode?: boolean;
}

const VisualizationContainer: React.FC<VisualizationContainerProps> = ({
  title,
  description,
  dropdown,
  children,
  studentMode = false,
}) => {
  const [globalState] = useAtom(globalStateAtom);
  const [selectedId, setSelectedId] = useState<string | null>(
    studentMode ? globalState.studentId : null
  );

  const { data: students, status: studentsStatus } = useQuery<IDWithName[]>({
    queryKey: ["students"],
    queryFn: fetchStudents,
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });

  const { data: assignments, status: assignmentsStatus } = useQuery<
    IDWithName[]
  >({
    queryKey: ["assignments"],
    queryFn: fetchAssignments,
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (selectedId || studentMode) return;

    // Set the selected ID to the first student or assignment
    if (students && students.length > 0 && dropdown === "student") {
      setSelectedId(students[0].id);
    }

    // Set the selected ID to the first assignment
    if (assignments && assignments.length > 0 && dropdown === "assignment") {
      setSelectedId(assignments[0].id);
    }
  }, [students, assignments, selectedId]);

  async function fetchStudents(): Promise<IDWithName[]> {
    try {
      if (studentMode) {
        return [
          {
            id: globalState.studentId,
            name: globalState.studentId,
          },
        ];
      }
      const data = await getStudents(1, 100, globalState.ferpaPrivacy);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async function fetchAssignments(): Promise<IDWithName[]> {
    try {
      const data = await getAssignments();
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  const selectedItemPretty = useMemo(() => {
    if (!selectedId) return "";
    if (dropdown === "student") {
      const found = students?.find((s) => s.id === selectedId)?.name;
      return found ? truncateString(found, 20) : "Unknown";
    }

    if (dropdown === "assignment") {
      const found = assignments?.find((a) => a.id === selectedId)?.name;
      return found ? truncateString(found, 20) : "Unknown";
    }

    return "";
  }, [selectedId, students, assignments]);

  const StudentDropdown = () => (
    <CustomDropdown
      icon="person"
      label={selectedId ? selectedItemPretty : "Select Student"}
      loading={studentsStatus === "pending"}
    >
      {students?.map((s) => (
        <Dropdown.Item key={s.id} onClick={() => setSelectedId(s.id)}>
          {truncateString(s.name, 20)}
        </Dropdown.Item>
      ))}
    </CustomDropdown>
  );

  const AssignmentDropdown = () => (
    <CustomDropdown
      icon="file"
      label={selectedId ? selectedItemPretty : "Select Assignment"}
      loading={assignmentsStatus === "pending"}
    >
      {assignments?.map((a) => (
        <Dropdown.Item key={a.id} onClick={() => setSelectedId(a.id)}>
          {a.name}
        </Dropdown.Item>
      ))}
    </CustomDropdown>
  );

  const childWithProps = cloneElement(children as React.ReactElement, {
    selectedId,
    studentMode,
  });

  return (
    <Card className="tw-mt-4 tw-rounded-lg tw-shadow-sm tw-p-4">
      <div className="tw-flex tw-flex-row tw-justify-between">
        <div className="tw-flex tw-flex-col">
          <h3 className="tw-text-2xl tw-font-semibold tw-mb-1">{title}</h3>
          <p className="tw-text-xs tw-text-gray-500">{description}</p>
        </div>
        {dropdown === "student" && <StudentDropdown />}
        {dropdown === "assignment" && <AssignmentDropdown />}
      </div>
      {childWithProps}
    </Card>
  );
};

export default VisualizationContainer;
