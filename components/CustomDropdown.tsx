import { truncateString } from "@/utils/text-helpers";
import { useId } from "react";
import { Dropdown, DropdownProps } from "react-bootstrap";
import { FileEarmarkTextFill, Person, PersonFill } from "react-bootstrap-icons";

interface CustomDropdownProps extends DropdownProps {
  icon: "file" | "person";
  children: React.ReactNode;
  label: string;
  loading?: boolean;
  disabled?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  icon,
  children,
  label,
  loading,
  disabled,
  ...props
}) => {
  const id = useId();
  return (
    <Dropdown {...props} id={id}>
      <Dropdown.Toggle variant="light" disabled={disabled || loading}>
          {loading ? (
            <div
              className="spinner-border spinner-border-sm tw-mr-1"
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
          ) : icon === "file" ? (
            <FileEarmarkTextFill className="tw-mb-1 tw-mr-1" />
          ) : (
            <PersonFill className="tw-mb-1 tw-mr-1" />
          )}
          {truncateString(label, 30)}
      </Dropdown.Toggle>
      <Dropdown.Menu
      className="tw-max-h-80 tw-overflow-y-auto tw-overflow-x-hidden"
      >{children}</Dropdown.Menu>
    </Dropdown>
  );
};

export default CustomDropdown;
