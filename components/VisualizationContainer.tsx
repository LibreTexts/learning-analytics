"use client";
import { useState } from "react";
import { Card, Dropdown, Form, InputGroup } from "react-bootstrap";
import { Person, PersonFill } from "react-bootstrap-icons";
import ResponsiveWrapper from "./ResponsiveWrapper";

interface VisualizationContainerProps {
  title: string;
  description: string;
  studentDropdown?: boolean;
  children: React.ReactNode;
}

const VisualizationContainer: React.FC<VisualizationContainerProps> = ({
  title,
  description,
  studentDropdown,
  children,
}) => {
  const [student, setStudent] = useState<string>("");
  return (
    <Card className="tw-mt-4 tw-rounded-lg tw-shadow-sm tw-p-4">
      <div className="tw-flex tw-flex-row tw-justify-between">
        <div className="tw-flex tw-flex-col">
          <h3 className="tw-text-2xl tw-font-semibold tw-mb-1">{title}</h3>
          <p className="tw-text-xs tw-text-gray-500">{description}</p>
        </div>
        {studentDropdown && (
          <Dropdown>
            <Dropdown.Toggle variant="light" id="dropdown-basic">
              <PersonFill className="tw-mb-1 tw-mr-1" />
              {student ? `Student ${student}` : "Select Student"}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setStudent("1")}>
                Student 1
              </Dropdown.Item>
              <Dropdown.Item>Student 2</Dropdown.Item>
              <Dropdown.Item>Student 3</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>
      {children}
    </Card>
  );
};

export default VisualizationContainer;
