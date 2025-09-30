"use client";
import { useState } from "react";
import { Button, Modal } from "react-bootstrap";

interface LearningObjectiveQuestionsAlignedProps {
  questions: string[];
}

const LearningObjectiveQuestionsAligned: React.FC<
  LearningObjectiveQuestionsAlignedProps
> = ({ questions }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <a
        onClick={() => setOpen(true)}
        className="tw:blue-500 tw:cursor-pointer tw:no-underline"
      >
        {questions.length ?? 0}
      </a>
      <Modal
        show={open}
        onHide={() => setOpen(false)}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Questions Aligned to Learning Objective
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ul>
            {questions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default LearningObjectiveQuestionsAligned;
