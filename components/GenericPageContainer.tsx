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
        "tw-flex tw-flex-col tw-w-full tw-mb-16"
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export default GenericPageContainer;
