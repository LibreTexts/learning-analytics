"use client";
import { GlobalState, IDWithText } from "@/lib/types";
import React, { useEffect, useState } from "react";
import { Button, Form, ListGroup, Toast } from "react-bootstrap";
import ToastContainer from "../ToastContainer";
import { useGlobalContext } from "@/state/globalContext";
import TransferList from "../TransferList";
import classNames from "classnames";
import { getCourseFrameworkData } from "@/lib/analytics-functions";

interface FrameworkExclusionsProps {
  className?: string;
  saveData: (
    course_id: string,
    data: Partial<GlobalState>
  ) => Promise<void> | void;
}

const FrameworkExclusions: React.FC<FrameworkExclusionsProps> = ({
  className,
  saveData,
}) => {
  const [globalState, setGlobalState] = useGlobalContext();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableItems, setAvailableItems] = useState<IDWithText[]>([]);
  const [selectedItems, setSelectedItems] = useState<IDWithText[]>([]);

  useEffect(() => {
    if (!globalState.courseID) return;
    fetchFrameworkDescriptors();
  }, [globalState.courseID]);

  useEffect(() => {
    setSelectedItems(globalState.frameworkExclusions || []);
  }, [globalState.frameworkExclusions]);

  async function fetchFrameworkDescriptors() {
    try {
      const data = await getCourseFrameworkData(globalState.courseID);

      const flattened = [...data.descriptors, ...data.levels];
      const unique = Array.from(new Set(flattened.map((a) => a.text)))
        .map((text) => {
          return flattened.find((a) => a.text === text);
        })
        .filter((a) => a);

      setAvailableItems(unique as IDWithText[]);
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async function handleSave() {
    try {
      setLoading(true);

      await saveData(globalState.courseID, {
        frameworkExclusions: selectedItems,
      });

      const newGlobalState = {
        ...globalState,
        frameworkExclusions: selectedItems,
      };

      setGlobalState(newGlobalState);
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={classNames(className)}>
      <ListGroup className="!tw-shadow-sm tw-w-full tw-h-fit">
        <ListGroup.Item className="tw-bg-ultra-light-gray">
          Framework Exclusions
        </ListGroup.Item>
        <ListGroup.Item className="tw-bg-white">
          <p className="tw-mb-6 tw-text-sm tw-text-slate-500">
            Exclude specific framework descriptors from analytics
            visualizations.
          </p>
          <TransferList<IDWithText>
            availableItemsLabel="Available Framework Descriptors"
            selectedItemsLabel="Excluded Framework Descriptors"
            availableItems={availableItems}
            selectedItems={selectedItems}
            setAvailableItems={setAvailableItems}
            setSelectedItems={setSelectedItems}
            renderItem={(item) => <span>{item.text}</span>}
            allowManualEntry={false}
            compareItems={(a, b) => {
              return a.text.localeCompare(b.text, undefined, {
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

export default FrameworkExclusions;
