import { GlobalState, IDWithName, IDWithText } from "#types/index";
import React, { useEffect, useState } from "react";
import { Button, Form, ListGroup, Toast } from "react-bootstrap";
import ToastContainer from "../ToastContainer";
import { useGlobalContext } from "~/state/globalContext";
import TransferList from "../TransferList";
import classNames from "classnames";
import api from "~/api";

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
  const [saveError, setSaveError] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableItems, setAvailableItems] = useState<IDWithName[]>([]);
  const [selectedItems, setSelectedItems] = useState<IDWithName[]>([]);

  useEffect(() => {
    if (!globalState.courseID) return;
    fetchFrameworkDescriptors();
  }, [globalState.courseID]);

  useEffect(() => {
    if (!globalState.frameworkExclusions) return;
    updateItemsState(
      globalState.frameworkExclusions?.map((item) => ({
        id: item.id,
        name: item.text,
      })) ?? [],
      availableItems
    );
  }, [globalState.frameworkExclusions]);

  async function fetchFrameworkDescriptors() {
    try {
      const res = await api.getCourseFrameworkData(globalState.courseID);
      const data = res.data;

      const flattened = [...data.descriptors, ...data.levels];
      const unique = Array.from(new Set(flattened.map((a) => a.text)))
        .map((text) => {
          return flattened.find((a) => a.text === text);
        })
        .filter((a) => a);

      const mapped: IDWithName[] = [];
      for (let i = 0; i < unique.length; i++) {
        if (!unique[i]) continue;
        mapped.push({
          id: unique[i]?.id as string,
          name: unique[i]?.text as string,
        });
      }

      updateItemsState(
        globalState.frameworkExclusions?.map((item) => ({
          id: item.id,
          name: item.text,
        })) ?? [],
        mapped
      );
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  function updateItemsState(
    exclusions: IDWithName[],
    availableItems: IDWithName[]
  ) {
    setSelectedItems(exclusions || []);
    setAvailableItems(
      exclusions
        ? availableItems.filter(
            (item) => !exclusions?.some((exclusion) => exclusion.id === item.id)
          )
        : availableItems
    );
  }

  async function handleSave() {
    try {
      setLoading(true);
      setSaveError(false);

      // Map back to IDWithText
      const mapped = selectedItems.map(
        (item) =>
          ({
            id: item.id,
            text: item.name,
          } as IDWithText)
      );

      await saveData(globalState.courseID, {
        frameworkExclusions: mapped,
      });

      setGlobalState({
        ...globalState,
        frameworkExclusions: mapped,
      });
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      setSaveError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={classNames(className)}>
      <ListGroup className="!tw:shadow-sm tw:w-full tw:h-fit">
        <ListGroup.Item className="tw:bg-ultra-light-gray">
          Framework Exclusions
        </ListGroup.Item>
        <ListGroup.Item className="tw:bg-white">
          <p className="tw:mb-6 tw:text-sm tw:text-slate-500">
            Exclude specific framework descriptors from analytics
            visualizations.
          </p>
          {availableItems.length === 0 && selectedItems.length === 0 ? (
            <p className="tw:text-center tw:text-sm tw:text-slate-500">
              No framework descriptors available.
            </p>
          ) : (
            <>
              <TransferList
                availableItemsLabel="Available Framework Descriptors"
                selectedItemsLabel="Excluded Framework Descriptors"
                availableItems={availableItems}
                selectedItems={selectedItems}
                setAvailableItems={setAvailableItems}
                setSelectedItems={setSelectedItems}
              />
              <Form>
                <div className="tw:flex tw:justify-end tw:items-center">
                  {loading && (
                    <div
                      className="spinner-border spinner-border-sm"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  )}
                  <Button disabled={loading} color="blue" onClick={handleSave}>
                    Save
                  </Button>
                </div>
              </Form>
            </>
          )}
        </ListGroup.Item>
      </ListGroup>
      <ToastContainer>
        <Toast
          onClose={() => setShowSuccess(false)}
          show={showSuccess}
          className="tw:mt-2"
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
        <Toast
          onClose={() => setSaveError(false)}
          show={saveError}
          className="tw:mt-2"
          bg="danger"
          delay={3000}
          autohide
        >
          <Toast.Header>
            <strong className="me-auto">Error</strong>
          </Toast.Header>
          <Toast.Body className="!text-white">
            An error occurred while saving settings.
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default FrameworkExclusions;
