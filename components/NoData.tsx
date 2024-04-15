interface NoDataProps {
  width: number;
  height: number;
  msg?: string;
}

const NoData: React.FC<NoDataProps> = ({ width, height, msg }) => {
  return (
    <div
      style={{ width, height }}
      className="tw-flex tw-flex-row tw-justify-center tw-items-center"
    >
      <p className="tw-text-center tw-text-gray-500">
        {msg ? msg : "No data available for this selection."}
      </p>
    </div>
  );
};

export default NoData;
