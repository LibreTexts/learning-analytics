interface SelectOptionProps {
  width: number;
  height: number;
  msg: string;
}

const SelectOption: React.FC<SelectOptionProps> = ({ width, height, msg }) => {
  return (
    <div
      style={{ width, height }}
      className="tw-flex tw-flex-row tw-justify-center tw-items-center"
    >
      <p className="tw-text-center tw-text-gray-500">
        {msg}
      </p>
    </div>
  );
};

export default SelectOption;
