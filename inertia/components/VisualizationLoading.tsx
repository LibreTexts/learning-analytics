interface VisualizationLoadingProps {
  width: number;
  height: number;
}

const VisualizationLoading: React.FC<VisualizationLoadingProps> = ({
  width,
  height,
}) => {
  return (
    <div
      style={{ width, height }}
      className="tw:flex tw:flex-row tw:justify-center tw:items-center"
    >
      <div className="spinner-border tw:mb-1 " role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export default VisualizationLoading;
