interface LoadingComponentProps {
  width?: number;
  height?: number;
}

const LoadingComponent: React.FC<LoadingComponentProps> = ({
  width = 400,
  height = 400,
}) => {
  return (
    <div className="tw:w-full tw:flex tw:flex-col tw:items-center tw:align-center">
      <img
        src="https://cdn.libretexts.net/Icons/libretexts.png"
        alt="LibreTexts Logo"
        width={width}
        height={height}
      />
      <div className="tw:flex tw:space-x-6 tw:justify-center tw:items-center tw:mt-8">
        <div className="tw:h-8 tw:w-8 tw:bg-libre-blue tw:rounded-full tw:animate-bounce"></div>
        <div className="tw:h-8 tw:w-8 tw:bg-libre-blue tw:rounded-full tw:animate-bounce ![animation-delay:-0.15s]"></div>
        <div className="tw:h-8 tw:w-8 tw:bg-libre-blue tw:rounded-full tw:animate-bounce"></div>
      </div>
    </div>
  );
};

export default LoadingComponent;
