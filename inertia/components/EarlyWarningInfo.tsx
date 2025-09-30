"use client";
import { useState } from "react";
import { Button, Modal } from "react-bootstrap";

interface EarlyWarningInfoProps {}

const EarlyWarningInfo: React.FC<EarlyWarningInfoProps> = () => {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div>
      <Button
        onClick={() => setModalOpen(true)}
        variant="outline-info"
        size="sm"
      >
        About Early Warning
      </Button>
      <Modal
        show={modalOpen}
        onHide={() => setModalOpen(false)}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            About Early Warning System
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>How are predictions made?</h5>
          <p>
            The Early Warning System uses a machine learning predictive model to
            estimate student risk based on their academic performance relative
            to the averaged metrics of their peers. The model is updated every
            12 hours and uses the following metrics:
          </p>
          <ul>
            <li>Unweight Course Percentage</li>
            <li># of Unique Interaction Days</li>
            <li>% of Course Content Seen</li>
            <li>Per Assignment</li>
            <ul>
              <li>Unweighted Score</li>
              <li>Time on Task</li>
              <li>Time in Review</li>
            </ul>
          </ul>
          <h5>How is risk calculated?</h5>
          <p>
            The Early Warning System assumes a final grade of 70% as the passing
            threshold. Students with a predicted final grade of less than 79%
            are flagged with a risk level of "Warning". Students with a
            predicted final grade of less than 69% are flagged with a risk level
            of "Attention Needed".
          </p>
          <p>
            <strong>Note:</strong> Early Warning System predictions are not a
            guarantee of student performance and should only be used as a tool
            to identify students who may need additional support.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setModalOpen(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EarlyWarningInfo;
