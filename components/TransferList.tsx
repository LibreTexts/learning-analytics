import React, { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import {
  ChevronDoubleRight,
  ChevronRight,
  ChevronDoubleLeft,
  ChevronLeft,
  Plus,
} from "react-bootstrap-icons";

function not(a: string[], b: string[]) {
  return a.filter((value) => b.indexOf(value) === -1);
}

function intersection(a: string[], b: string[]) {
  return a.filter((value) => b.indexOf(value) !== -1);
}

function sort(a: string[]) {
  return a.sort((a, b) => a.localeCompare(b));
}

function noDuplicates(a: string[]) {
  return Array.from(new Set(a));
}

interface TransferListProps {
  availableItems: string[];
  setAvailableItems: (items: string[]) => void;
  selectedItems: string[];
  setSelectedItems: (items: string[]) => void;
  allowManualEntry?: boolean;
}

const TransferList: React.FC<TransferListProps> = ({
  availableItems,
  setAvailableItems,
  selectedItems,
  setSelectedItems,
  allowManualEntry,
}) => {
  const [checked, setChecked] = useState<string[]>([]);
  const availableChecked = intersection(checked, availableItems);
  const selectedChecked = intersection(checked, selectedItems);
  const [manualEntry, setManualEntry] = useState("");

  const handleAllSelected = () => {
    setSelectedItems(noDuplicates(sort(selectedItems.concat(availableItems))));
    setAvailableItems([]);
  };

  const handleCheckedRight = () => {
    setSelectedItems(
      noDuplicates(sort(selectedItems.concat(availableChecked)))
    );
    setAvailableItems(
      noDuplicates(sort(not(availableItems, availableChecked)))
    );
    setChecked(noDuplicates(not(checked, availableChecked)));
  };

  const handleCheckedLeft = () => {
    setAvailableItems(
      noDuplicates(sort(availableItems.concat(selectedChecked)))
    );
    setSelectedItems(noDuplicates(sort(not(selectedItems, selectedChecked))));
    setChecked(noDuplicates(sort(not(checked, selectedChecked))));
  };

  const handleAllAvailable = () => {
    setAvailableItems(noDuplicates(sort(availableItems.concat(selectedItems))));
    setSelectedItems([]);
  };

  const handleCheckItem = (value: string) => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(sort(newChecked));
  };

  const handleManualEntry = () => {
    if (manualEntry) {
      setSelectedItems(noDuplicates(sort(selectedItems.concat(manualEntry))));
      setManualEntry("");
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-w-full tw-h-96 tw-mb-4">
      <div className="tw-flex tw-flex-row">
        <div className="tw-flex tw-flex-col tw-basis-2/5">
          <p className="tw-font-bold tw-mb-0">Available Items</p>
          <div className="tw-flex tw-flex-col tw-border tw-border-solid tw-rounded-md tw-min-h-48 tw-h-72 tw-overflow-auto tw-mt-0.5">
            {availableItems.map((item) => (
              <div
                key={item}
                className="tw-flex tw-flex-row tw-items-center tw-p-2"
              >
                <Form.Check
                  checked={checked.indexOf(item) !== -1}
                  onChange={() => handleCheckItem(item)}
                />
                <span className="tw-ml-2">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="tw-flex tw-flex-col tw-h-full tw-justify-center tw-basis-1/5 tw-items-center">
          <Button className="!tw-mb-4" onClick={handleAllSelected}>
            <ChevronDoubleRight />
          </Button>
          <Button
            className="!tw-mb-4"
            onClick={handleCheckedRight}
            disabled={availableChecked.length === 0}
          >
            <ChevronRight />
          </Button>
          <Button
            className="!tw-mb-4"
            onClick={handleCheckedLeft}
            disabled={selectedChecked.length === 0}
          >
            <ChevronLeft />
          </Button>
          <Button onClick={handleAllAvailable}>
            <ChevronDoubleLeft />
          </Button>
        </div>
        <div className="tw-flex tw-flex-col tw-basis-2/5">
          <p className="tw-font-bold tw-mb-0">Selected Items</p>
          <div className="tw-flex tw-flex-col tw-border tw-border-solid tw-rounded-md tw-h-72 tw-overflow-auto tw-mt-0.5">
            {selectedItems.map((item) => (
              <div
                key={item}
                className="tw-flex tw-flex-row tw-items-center tw-p-2"
              >
                <Form.Check
                  checked={checked.indexOf(item) !== -1}
                  onChange={() => handleCheckItem(item)}
                />
                <span className="tw-ml-2">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {
        // Allow manual entry of items
        allowManualEntry && (
          <div className="tw-flex tw-flex-row tw-mt-2 tw-justify-end">
            <div className="tw-flex tw-flex-col tw-basis-2/5">
              <Form
                className="tw-flex tw-flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleManualEntry();
                }}
              >
                <Form.Control
                  type="text"
                  className="tw-border tw-rounded-md tw-w-full"
                  placeholder="Enter a new item"
                  value={manualEntry}
                  onChange={(e) => setManualEntry(e.target.value)}
                />
                <Button
                  color="blue"
                  className="!tw-ml-2"
                  onClick={handleManualEntry}
                >
                  <Plus />
                </Button>
              </Form>
              <p className="tw-text-sm tw-text-muted tw-text-gray-400 tw-italic tw-ml-1">
                Manually added items will need to be entered again if removed
                and list is saved.
              </p>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default TransferList;
