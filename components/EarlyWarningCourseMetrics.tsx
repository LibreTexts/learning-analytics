import SmallMetricCard from "./SmallMetricCard";

const EarlyWarningCourseMetrics = ({
  course_avg,
  course_std_dev,
}: {
  course_avg: number;
  course_std_dev: number;
}) => {
  return (
    <div className="tw-flex tw-flex-row tw-justify-center">
      <SmallMetricCard
        title="Course Avg"
        value={`${course_avg ?? 0}%`}
        unit="By Predicted Scores"
        loading={false}
      />
      <SmallMetricCard
        title="Course Std Dev"
        value={course_std_dev ?? 0}
        unit="By Predicted Scores"
        loading={false}
        className="tw-ml-36"
      />
    </div>
  );
};

export default EarlyWarningCourseMetrics;
