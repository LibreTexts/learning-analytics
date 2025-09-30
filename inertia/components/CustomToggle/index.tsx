"use client";
import "./CustomToggle.css";

interface CustomToggleProps {
  id: string;
  label: string;
  checked: boolean;
  disabled: boolean;
  small: boolean;
  onChange: (checked: boolean) => void;
}

const CustomToggle: React.FC<CustomToggleProps> = ({
  id,
  label,
  checked,
  disabled,
  small,
  onChange,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLLabelElement>) => {
    if (e.keyCode !== 32) return;
    e.preventDefault();
    onChange(!checked);
  };

  return (
    <div className={"toggle-switch" + (small ? " small-switch" : "")}>
      <input
        type="checkbox"
        className="toggle-switch-checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      {id ? (
        <label
          className="toggle-switch-label"
          htmlFor={id}
          tabIndex={disabled ? -1 : 1}
          onKeyDown={(e) => {
            handleKeyPress(e);
          }}
        >
          <span
            className={
              disabled
                ? "toggle-switch-inner toggle-switch-disabled"
                : "toggle-switch-inner"
            }
            data-label={label}
            tabIndex={-1}
          />
          <span
            className={
              disabled
                ? "toggle-switch-switch toggle-switch-disabled"
                : "toggle-switch-switch"
            }
            tabIndex={-1}
          />
        </label>
      ) : null}
    </div>
  );
};

export default CustomToggle;