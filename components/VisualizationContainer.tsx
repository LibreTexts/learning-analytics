"use client";
import React, { cloneElement, useEffect, useState } from "react";
import { Card, Dropdown, Form, InputGroup } from "react-bootstrap";
import { FileEarmarkTextFill, Person, PersonFill } from "react-bootstrap-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AnalyticsAPIResponse } from "@/lib/types";
import { IAdapt_Raw } from "@/lib/models/adapt";

interface VisualizationContainerProps {
  title: string;
  description: string;
  dropdown?: "student" | "assignment";
  children: React.ReactNode;
}

const VisualizationContainer: React.FC<VisualizationContainerProps> = ({
  title,
  description,
  dropdown,
  children,
}) => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: students, isFetching: isFetchingStudents } = useQuery<string[]>(
    {
      queryKey: ["students"],
      queryFn: getStudents,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  const { data: assignments, isFetching: isFetchingAssignments } = useQuery<
    { _id: string; assignment_name: string }[]
  >({
    queryKey: ["assignments"],
    queryFn: getAssignments,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  async function getStudents() {
    try {
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

  async function getAssignments() {
    try {
      const res = await axios.get<
        AnalyticsAPIResponse<{ _id: string; assignment_name: string }[]>
      >("/api/assignments");

      if (res.data.error) {
        throw new Error(res.data.error);
      }

      return res.data.data ?? [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  const StudentDropdown = () => (
    <Dropdown>
      <Dropdown.Toggle
        variant="light"
        id="dropdown-basic"
        disabled={isFetchingStudents}
      >
        <PersonFill className="tw-mb-1 tw-mr-1" />
        {selectedId ? `Student ${selectedId}` : "Select Student"}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {students?.map((s) => (
          <Dropdown.Item key={s} onClick={() => setSelectedId(s)}>
            {s}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );

  const AssignmentDropdown = () => (
    <Dropdown>
      <Dropdown.Toggle variant="light" id="dropdown-basic">
        <FileEarmarkTextFill className="tw-mb-1 tw-mr-1" />
        {selectedId ? `Assignment ${selectedId}` : "Select Assignment"}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {assignments?.map((a) => (
          <Dropdown.Item key={a._id} onClick={() => setSelectedId(a._id)}>
            {a.assignment_name}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );

  const childWithProps = cloneElement(children as React.ReactElement, {
    selectedId,
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
