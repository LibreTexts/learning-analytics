interface VisualizationTableProps {
  headRender: () => React.ReactNode;
  bodyRender: () => React.ReactNode;
}

/**
 * A generic table parent component for rendering visualization raw data
 * @param headRender  - Function that returns the JSX for the table head
 * @param bodyRender  - Function that returns the JSX for the table body
 * @returns
 */
const VisualizationTable: React.FC<VisualizationTableProps> = ({
  headRender,
  bodyRender,
}) => {
  return (
    <table className="tw:border-solid tw:border tw:border-slate-200 tw:shadow-sm tw:bg-white tw:w-full">
      <thead className="tw:border-b tw:border-solid">{headRender()}</thead>
      <tbody>{bodyRender()}</tbody>
    </table>
  );
};

export default VisualizationTable;
