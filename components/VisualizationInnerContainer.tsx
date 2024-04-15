import { forwardRef } from "react";

interface VisualizationInnerContainerProps {
  children: React.ReactNode;
}

const VisualizationInnerContainer = forwardRef(
  (
    props: VisualizationInnerContainerProps,
    ref: React.ForwardedRef<HTMLDivElement>
  ) => {
    return (
      <div ref={ref} className="tw-bg-gray-100 tw-rounded-md">
        {props.children}
      </div>
    );
  }
);

export default VisualizationInnerContainer;
