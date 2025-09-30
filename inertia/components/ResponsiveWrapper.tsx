'use client'
import useDimensions from "~/hooks/useDimensions";
import { cloneElement, useRef } from "react";

const ResponsiveWrapper = ({ children }: { children: React.ReactNode }) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { width, height } = useDimensions(targetRef);

  const childWithProps = cloneElement(children as React.ReactElement, {
    width,
    height,
  });

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center"
      ref={targetRef}
    >
      {childWithProps}
    </div>
  );
};

export default ResponsiveWrapper;
