"use string";
import { useEffect, useState } from "react";
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
  value: initialValue,
  onChange,
  placeholder = "Search...",
  delay = 250,
  prefix = false,
  ...props
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value]);

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
        onChange={(e) => setValue(e.target.value)}
      />
    </InputGroup>
  );
};

export default DebouncedInput;
