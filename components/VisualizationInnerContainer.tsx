interface VisualizationInnerContainerProps {
  children: React.ReactNode;
}

const VisualizationInnerContainer: React.FC<
  VisualizationInnerContainerProps
> = ({ children }) => {
  return <div className="tw-bg-gray-200 tw-rounded-md tw-p-4">{children}</div>;
};

export default VisualizationInnerContainer;
