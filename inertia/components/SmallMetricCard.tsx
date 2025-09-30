import { Card } from "react-bootstrap";
import classNames from "classnames";

interface SmallMetricCardProps {
  title: string;
  value?: number | string;
  unit?: string;
  className?: string;
  loading?: boolean;
}

const SmallMetricCard: React.FC<SmallMetricCardProps> = ({
  title,
  value,
  unit,
  className,
  loading = false,
}) => {
  return (
    <Card
      className={classNames(
        className,
        "tw:!p-4 tw:!rounded-lg tw:!shadow-sm tw:!w-72"
      )}
    >
      <h3 className="tw:text-lg tw:font-semibold">{title}</h3>
      {loading && (
        <div className="tw:w-full tw:h-16 tw:justify-center tw:flex tw:flex-row tw:items-center">
          <div className="spinner-border spinner-border-md" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      {!loading && (
        <p className="tw:text-6xl tw:font-semibold tw:text-center">
          {!value
            ? 0
            : typeof value === "string"
            ? value
            : new Intl.NumberFormat().format(value)}
        </p>
      )}
      {unit && <p className="tw:text-sm tw:mb-0 tw:text-slate-400">{unit}</p>}
    </Card>
  );
};

export default SmallMetricCard;
