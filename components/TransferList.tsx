import React, { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import {
  ChevronDoubleRight,
  ChevronRight,
  ChevronDoubleLeft,
  ChevronLeft,
  Plus,
} from "react-bootstrap-icons";

function not<T>(a: T[], b: T[]) {
  if (!a || !b) return [];
  if (typeof a === "string" || typeof b === "string") return [];
  if (!Array.isArray(a) || !Array.isArray(b)) return [];

  return a.filter((value) => b.indexOf(value) === -1);
}

function intersection<T>(a: T[], b: T[]) {
  if (!a || !b) return [];
  if (typeof a === "string" || typeof b === "string") return [];
  if (!Array.isArray(a) || !Array.isArray(b)) return [];

  return a.filter((value) => b.indexOf(value) !== -1);
}

function sort<T>(a: T[], compareFn: (a: T, b: T) => number) {
  return a.sort(compareFn);
}

function noDuplicates<T>(a: T[]) {
  return Array.from(new Set(a));
}

interface TransferListProps<T> {
  availableItems: T[];
  setAvailableItems: (items: T[]) => void;
  selectedItems: T[];
  setSelectedItems: (items: T[]) => void;
  allowManualEntry?: boolean;
  renderItem: (item: T) => React.ReactNode;
  compareItems: (a: T, b: T) => number;
  availableItemsLabel?: string;
  selectedItemsLabel?: string;
}

const TransferList = <T extends unknown>({
  availableItems,
  setAvailableItems,
  selectedItems,
  setSelectedItems,
  allowManualEntry,
  renderItem,
  compareItems,
  availableItemsLabel,
  selectedItemsLabel,
}: TransferListProps<T>) => {
  const [checked, setChecked] = useState<T[]>([]);
  const availableChecked = intersection(checked, availableItems);
  const selectedChecked = intersection(checked, selectedItems);
  const [manualEntry, setManualEntry] = useState<T | null>(null);

  const handleAllSelected = () => {
    setSelectedItems(
      noDuplicates(sort(selectedItems.concat(availableItems), compareItems))
    );
    setAvailableItems([]);
  };

  const handleCheckedRight = () => {
    setSelectedItems(
      noDuplicates(sort(selectedItems.concat(availableChecked), compareItems))
    );
    setAvailableItems(
      noDuplicates(sort(not(availableItems, availableChecked), compareItems))
    );
    setChecked(noDuplicates(not(checked, availableChecked)));
  };

  const handleCheckedLeft = () => {
    setAvailableItems(
      noDuplicates(sort(availableItems.concat(selectedChecked), compareItems))
    );
    setSelectedItems(
      noDuplicates(sort(not(selectedItems, selectedChecked), compareItems))
    );
    setChecked(noDuplicates(sort(not(checked, selectedChecked), compareItems)));
  };

  const handleAllAvailable = () => {
    setAvailableItems(
      noDuplicates(sort(availableItems.concat(selectedItems), compareItems))
    );
    setSelectedItems([]);
  };

  const handleCheckItem = (value: T) => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(sort(newChecked, compareItems));
  };

  const handleManualEntry = () => {
    if (manualEntry !== null) {
      setSelectedItems(
        noDuplicates(sort(selectedItems.concat(manualEntry), compareItems))
      );
      setManualEntry(null);
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-w-full tw-h-96 tw-mb-4">
      <div className="tw-flex tw-flex-row">
        <div className="tw-flex tw-flex-col tw-basis-2/5">
          <p className="tw-font-bold tw-mb-0">
            {availableItemsLabel ?? "Available Items"}
          </p>
          <div className="tw-flex tw-flex-col tw-border tw-border-solid tw-rounded-md tw-min-h-48 tw-h-72 tw-overflow-auto tw-mt-0.5">
            {availableItems.map((item) => (
              <div
                key={crypto.randomUUID()}
                className="tw-flex tw-flex-row tw-items-center tw-p-2"
              >
                <Form.Check
                  checked={checked.indexOf(item) !== -1}
                  onChange={() => handleCheckItem(item)}
                />
                <span className="tw-ml-2">
                  {
                    typeof renderItem === "function"
                      ? renderItem(item)
                      : JSON.stringify(item) // fallback to JSON.stringify
                  }
                </span>
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
          <p className="tw-font-bold tw-mb-0">
            {selectedItemsLabel ?? "Selected Items"}
          </p>
          <div className="tw-flex tw-flex-col tw-border tw-border-solid tw-rounded-md tw-h-72 tw-overflow-auto tw-mt-0.5">
            {selectedItems.map((item) => (
              <div
                key={crypto.randomUUID()}
                className="tw-flex tw-flex-row tw-items-center tw-p-2"
              >
                <Form.Check
                  checked={checked.indexOf(item) !== -1}
                  onChange={() => handleCheckItem(item)}
                />
                <span className="tw-ml-2">
                  {
                    typeof renderItem === "function"
                      ? renderItem(item)
                      : JSON.stringify(item) // fallback to JSON.stringify
                  }
                </span>
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
                  value={manualEntry?.toString() ?? ""}
                  onChange={(e) =>
                    setManualEntry(e.target.value as unknown as T)
                  }
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
