"use client";
import { GlobalState, IDWithName } from "@/lib/types";
import React, { useEffect, useState } from "react";
import { Button, Form, ListGroup, Toast } from "react-bootstrap";
import ToastContainer from "../ToastContainer";
import { useGlobalContext } from "@/state/globalContext";
import TransferList from "../TransferList";
import classNames from "classnames";
import { getAssignments } from "@/lib/analytics-functions";
import { useQueryClient } from "@tanstack/react-query";

interface AssignmentExclusionsProps {
  className?: string;
  saveData: (
    course_id: string,
    data: Partial<GlobalState>
  ) => Promise<void> | void;
}

const AssignmentExclusions: React.FC<AssignmentExclusionsProps> = ({
  className,
  saveData,
}) => {
  const queryClient = useQueryClient();
  const [globalState, setGlobalState] = useGlobalContext();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableItems, setAvailableItems] = useState<IDWithName[]>([]);
  const [selectedItems, setSelectedItems] = useState<IDWithName[]>([]);

  useEffect(() => {
    if (!globalState.courseID) return;
    fetchAssignments();
  }, [globalState.courseID]);

  useEffect(() => {
    setSelectedItems(globalState.assignmentExclusions || []);
  }, [globalState.assignmentExclusions]);

  async function fetchAssignments() {
    try {
      const data = await getAssignments(globalState.courseID, true);
      setAvailableItems(data);
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async function handleSave() {
    try {
      setLoading(true);

      await saveData(globalState.courseID, {
        assignmentExclusions: selectedItems,
      });

      const newGlobalState = {
        ...globalState,
        assignmentExclusions: selectedItems,
      };

      setGlobalState(newGlobalState);
      setShowSuccess(true);
      queryClient.invalidateQueries({
        queryKey: ["assignments", globalState.courseID],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const renderItem = (item: IDWithName) => <span>{item.name}</span>;

  return (
    <div className={classNames(className)}>
      <ListGroup className="!tw-shadow-sm tw-w-full tw-h-fit">
        <ListGroup.Item className="tw-bg-ultra-light-gray">
          Assignment Exclusions
        </ListGroup.Item>
        <ListGroup.Item className="tw-bg-white">
          <p className="tw-mb-6 tw-text-sm tw-text-slate-500">
            Exclude specific assignments from analytics visualizations.
          </p>
          <TransferList<IDWithName>
            availableItemsLabel="Available Assignments"
            selectedItemsLabel="Excluded Assignments"
            availableItems={availableItems}
            selectedItems={selectedItems}
            setAvailableItems={setAvailableItems}
            setSelectedItems={setSelectedItems}
            allowManualEntry={false}
            renderItem={renderItem}
            compareItems={(a, b) => {
              return a.name.localeCompare(b.name, undefined, {
                numeric: true,
                sensitivity: "base",
              });
            }}
          />
          <Form>
            <div className="tw-flex tw-justify-end tw-items-center">
              {loading && (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              )}
              <Button disabled={loading} color="blue" onClick={handleSave}>
                Save
              </Button>
            </div>
          </Form>
        </ListGroup.Item>
      </ListGroup>
      <ToastContainer>
        <Toast
          onClose={() => setShowSuccess(false)}
          show={showSuccess}
          className="tw-mt-2"
          bg="primary"
          delay={3000}
          autohide
        >
          <Toast.Header>
            <strong className="me-auto">Success!</strong>
          </Toast.Header>
          <Toast.Body className="!text-white">
            Settings saved successfully.
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default AssignmentExclusions;
