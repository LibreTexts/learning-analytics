"use client";
import { GlobalState } from "@/lib/types";
import React, { useState } from "react";
import { Button, Form, ListGroup, Toast } from "react-bootstrap";
import ToastContainer from "../ToastContainer";
import { Controller, useForm } from "react-hook-form";
import { useGlobalContext } from "@/state/globalContext";

interface StudentPermissionsProps {
  saveData: (
    course_id: string,
    data: Partial<GlobalState>
  ) => Promise<void> | void;
}

const StudentPermissions: React.FC<StudentPermissionsProps> = ({
  saveData,
}) => {
  const [globalState, setGlobalState] = useGlobalContext();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    control,
    setValue,
    getValues,
    formState: { isDirty },
    reset,
  } = useForm<Pick<GlobalState, "shareGradeDistribution">>({
    defaultValues: {
      shareGradeDistribution: globalState.shareGradeDistribution,
    },
  });

  async function handleSave() {
    try {
      setLoading(true);

      await saveData(globalState.courseID, {
        shareGradeDistribution: getValues().shareGradeDistribution,
      });

      const newGlobalState = {
        ...globalState,
        shareGradeDistribution: getValues().shareGradeDistribution,
      };

      setGlobalState(newGlobalState);
      reset(newGlobalState);
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ListGroup className="!tw-shadow-sm tw-w-full tw-h-fit">
        <ListGroup.Item className="tw-bg-ultra-light-gray">
          Student Permissions
        </ListGroup.Item>
        <ListGroup.Item className="tw-bg-white">
          <Form>
            <Controller
              name="shareGradeDistribution"
              control={control}
              render={({ field }) => (
                <Form.Check
                  type="switch"
                  id="shareGradeDistribution"
                  label="Share Grade Distribution"
                  checked={field.value}
                  onChange={(e) => {
                    setValue("shareGradeDistribution", e.target.checked, {
                      shouldDirty: true,
                    });
                  }}
                />
              )}
            />
            <div className="tw-flex tw-justify-end tw-items-center">
              {loading && (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              )}
              <Button disabled={!isDirty} color="blue" onClick={handleSave}>
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
          <Toast.Body>Settings saved successfully.</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default StudentPermissions;
