"use client";
import React, { cloneElement, useEffect, useState } from "react";
import { Card, Dropdown } from "react-bootstrap";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AnalyticsAPIResponse } from "@/lib/types";
import CustomDropdown from "./CustomDropdown";
import { useSelector } from "@/redux";
import { truncateString } from "@/utils/texthelpers";
import { getAssignments } from "@/lib/analytics-functions";

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
  const queryClient = useQueryClient();
  const globalSettings = useSelector((state) => state.globalSettings);
  const [selectedId, setSelectedId] = useState<string | null>(
    studentMode ? globalSettings.studentId : null
  );

  const {
    data: students,
    isFetching: isFetchingStudents,
    status: studentsStatus,
  } = useQuery<string[]>({
    queryKey: ["students"],
    queryFn: getStudents,
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });

  const {
    data: assignments,
    isFetching: isFetchingAssignments,
    status: assignmentsStatus,
  } = useQuery<{ _id: string; assignment_name: string }[]>({
    queryKey: ["assignments"],
    queryFn: fetchAssignments,
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (selectedId || studentMode) return;

    // Set the selected ID to the first student or assignment
    if (students && students.length > 0 && dropdown === "student") {
      setSelectedId(students[0]);
    }

    // Set the selected ID to the first assignment
    if (assignments && assignments.length > 0 && dropdown === "assignment") {
      setSelectedId(assignments[0]._id);
    }
  }, [students, assignments, selectedId]);

  async function getStudents() {
    try {
      if (studentMode) return [globalSettings.studentId];
      const res = await axios.get<AnalyticsAPIResponse<string[]>>(
        "/api/students"
      );

      if (res.data.error) {
        throw new Error(res.data.error);
      }

      return res.data.data ?? [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async function fetchAssignments() {
    try {
      // const res = await axios.get<
      //   AnalyticsAPIResponse<{ _id: string; assignment_name: string }[]>
      // >("/api/assignments");

      // if (res.data.error) {
      //   throw new Error(res.data.error);
      // }

      //return res.data.data ?? [];

      const data = await getAssignments();
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  const StudentDropdown = () => (
    <CustomDropdown
      icon="person"
      label={
        selectedId
          ? `Student ${truncateString(selectedId, 10)}`
          : "Select Student"
      }
      loading={studentsStatus === "pending"}
    >
      {students?.map((s) => (
        <Dropdown.Item key={s} onClick={() => setSelectedId(s)}>
          {truncateString(s, 20)}
        </Dropdown.Item>
      ))}
    </CustomDropdown>
  );

  const AssignmentDropdown = () => (
    <CustomDropdown
      icon="file"
      label={selectedId ? `Assignment ${selectedId}` : "Select Assignment"}
      loading={assignmentsStatus === "pending"}
    >
      {assignments?.map((a) => (
        <Dropdown.Item key={a._id} onClick={() => setSelectedId(a._id)}>
          {a.assignment_name}
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
