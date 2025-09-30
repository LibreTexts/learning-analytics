import SmallMetricCard from "./SmallMetricCard";

const EarlyWarningCourseMetrics = ({
  course_avg,
  course_std_dev,
}: {
  course_avg: number;
  course_std_dev: number;
}) => {
  return (
    <div className="tw:flex tw:flex-row tw:justify-center">
      <SmallMetricCard
        title="Average of Predicted Scores"
        value={`${course_avg ?? 0}%`}
        loading={false}
      />
      <SmallMetricCard
        title="Std. Dev. of Predicted Scores"
        value={course_std_dev ?? 0}
        loading={false}
        className="tw:ml-36"
      />
    </div>
  );
};

export default EarlyWarningCourseMetrics;
