import { IDWithName } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import { Button, Form } from "react-bootstrap";
import {
  ChevronDoubleRight,
  ChevronRight,
  ChevronDoubleLeft,
  ChevronLeft,
} from "react-bootstrap-icons";

function not(a: IDWithName[], b: IDWithName[]) {
  if (!a || !b) return [];
  return a.filter((value) => !b.some((bValue) => value.id === bValue.id));
}

function intersection(a: IDWithName[], b: IDWithName[]) {
  if (!a || !b) return [];
  return a.filter((value) => b.some((bValue) => value.id === bValue.id));
}

function sort(a: IDWithName[]) {
  return a.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );
}

function noDuplicates(a: IDWithName[]): IDWithName[] {
  const seen = new Set();
  return a.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

interface TransferListProps {
  availableItems: IDWithName[];
  setAvailableItems: (items: IDWithName[]) => void;
  selectedItems: IDWithName[];
  setSelectedItems: (items: IDWithName[]) => void;
  availableItemsLabel?: string;
  selectedItemsLabel?: string;
}

const TransferList: React.FC<TransferListProps> = ({
  availableItems,
  setAvailableItems,
  selectedItems,
  setSelectedItems,
  availableItemsLabel,
  selectedItemsLabel,
}) => {
  const [checked, setChecked] = useState<IDWithName[]>([]);

  const availableChecked = intersection(checked, availableItems);
  const selectedChecked = intersection(checked, selectedItems);

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

  const handleCheckItem = (value: IDWithName) => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(sort(newChecked));
  };

  const renderItem = (item: IDWithName) => <span>{item.name}</span>;

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
                key={item.id}
                className="tw-flex tw-flex-row tw-items-center tw-p-2"
              >
                <Form.Check
                  checked={checked.indexOf(item) !== -1}
                  onChange={() => handleCheckItem(item)}
                />
                <span className="tw-ml-2">{renderItem(item)}</span>
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
                key={JSON.stringify(item)}
                className="tw-flex tw-flex-row tw-items-center tw-p-2"
              >
                <Form.Check
                  checked={checked.indexOf(item) !== -1}
                  onChange={() => handleCheckItem(item)}
                />
                <span className="tw-ml-2">{renderItem(item)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferList;
