import classNames from "classnames";

interface GenericPageContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GenericPageContainer: React.FC<GenericPageContainerProps> = ({
  children,
  className,
  ...rest
}) => {
  return (
    <div
      className={classNames(
        className,
        "tw-grid tw-auto-rows-min tw-grid-flow-row tw-mb-16 tw-min-w-0 tw-max-w-[97%] tw-mx-auto"
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export default GenericPageContainer;
