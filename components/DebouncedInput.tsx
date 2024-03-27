"use string";
import useDebounce from "@/hooks/useDebounce";
import { Form, InputGroup } from "react-bootstrap";

interface DebouncedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  prefix?: boolean;
  prefixElement?: React.ReactNode;
}

const DebouncedInput: React.FC<DebouncedInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  delay = 500,
  prefix = false,
  ...props
}) => {
  const { debounce } = useDebounce();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const debouncedHandleInputChange = debounce(handleInputChange, delay);

  return (
    <InputGroup>
      {prefix && (
        <InputGroup.Text id="input-prepen">
          {props.prefixElement}
        </InputGroup.Text>
      )}
      <Form.Control
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={debouncedHandleInputChange}
      />
    </InputGroup>
  );
};

export default DebouncedInput;
