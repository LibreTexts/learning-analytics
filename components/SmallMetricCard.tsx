import { Card } from "react-bootstrap";
import classNames from "classnames";

interface SmallMetricCardProps {
  title: string;
  value: number | string;
  unit: string;
  className?: string;
}

const SmallMetricCard: React.FC<SmallMetricCardProps> = ({
  title,
  value,
  unit,
  className,
}) => {
  return (
    <Card
      className={classNames(
        className,
        "tw-p-4 tw-rounded-lg tw-shadow-sm tw-w-72"
      )}
    >
      <h3 className="tw-text-lg tw-font-semibold">{title}</h3>
      <p className="tw-text-6xl tw-font-semibold tw-text-center">
        {
          // If the value is a string, return it as is
          typeof value === "string"
            ? value
            : new Intl.NumberFormat().format(value)
        }
      </p>
      <p className="tw-text-sm tw-mb-0 tw-text-slate-400">{unit}</p>
    </Card>
  );
};

export default SmallMetricCard;
