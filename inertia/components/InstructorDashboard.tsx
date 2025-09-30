import GenericPageContainer from '~/components/GenericPageContainer'
import PageHeader from '~/components/PageHeader'
import VisualizationContainer from '~/components/VisualizationContainer'
import PerfPerAssignment from '~/components/Visualizations/PerfPerAssignment'
import SubmissionTimeline from '~/components/Visualizations/SubmissionTimeline'
import InstructorQuickMetrics from '~/components/InstructorQuickMetrics'
import ADAPTPerformance from './Visualizations/ADAPTPerformance'
import GradeDistribution from './Visualizations/GradeDistribution'
import ActivityAccessed from './Visualizations/StudentActivity'
import TimeInReview from './Visualizations/TimeInReview'
import TimeOnTask from './Visualizations/TimeOnTask'
import NoCourseData from './NoCourseData'
import useInstructorAnalytics from '~/hooks/useInstructorAnalytics'

function InstructorDashboard({
  course_id,
  student_id,
  assignment_id,
  letter_grades_released = false,
  has_data,
}: {
  course_id: string
  student_id: string | null
  assignment_id: string | null
  letter_grades_released: boolean
  has_data: boolean
}) {
  const {
    performancePerAssignment,
    activityAccessed,
    timeOnTask,
    timeInReview,
    submissionTimeline,
    adaptPerformance,
    gradeDistribution,
  } = useInstructorAnalytics(course_id, student_id, assignment_id)

  return (
    <GenericPageContainer>
      <PageHeader
        title="Instructor Dashboard"
        subtitle="View analytics and data visualizations for your course."
      />
      {has_data ? (
        <>
          <InstructorQuickMetrics course_id={course_id} />
          <VisualizationContainer
            title="Performance per Assignment"
            description="Class average vs. selected student's scores"
            tooltipDescription="Performance per assignment is the student's score on each assignment, compared to the class average."
          >
            <PerfPerAssignment data={performancePerAssignment || []} />
          </VisualizationContainer>
          <VisualizationContainer
            title="Student Activity on Assignment"
            description="Submitted vs. unsubmitted questions for selected student"
          >
            <ActivityAccessed data={activityAccessed || []} />
          </VisualizationContainer>
          {/* <VisualizationContainer
        title="Textbook Activity"
        description="Class average vs. selected student's activity"
        dropdown="student"
      >
        <TextbookActivity getData={getPerformancePerAssignment} />
      </VisualizationContainer> */}
          <VisualizationContainer
            title="Time on Task"
            description="Class average vs. selected student's cumulative time on task per question"
            tooltipDescription="Time on task is the student's time spent working on a question before they submit it."
          >
            <TimeOnTask data={timeOnTask || []} />
          </VisualizationContainer>
          <VisualizationContainer
            title="Time in Review"
            description="Class average vs. selected student's cumulative time in review per question"
            tooltipDescription="Time in review is the student's time spent reviewing questions after they have been submitted."
          >
            <TimeInReview data={timeInReview || []} />
          </VisualizationContainer>
          {/* <VisualizationContainer
        title="Time on Task (Homework)"
        description="Class average vs. selected student's time on task"
      >
        <NoData width={1200} height={400} />
      </VisualizationContainer> */}
          <VisualizationContainer
            title="Submission Activity (All Students)"
            description="Timeline of student submissions for selected assignment"
            tooltipDescription="A histogram of student submissions over time for the selected assignment."
          >
            <SubmissionTimeline data={submissionTimeline} />
          </VisualizationContainer>
          {/* <VisualizationContainer
              title="Textbook Engagment"
              description="Number of unique interactions with the textbook by date"
            >
              <TextbookEngagement getData={getTextbookEngagement} />
            </VisualizationContainer> */}
          {letter_grades_released ? (
            <>
              <VisualizationContainer
                title="Final Score Distribution"
                description="Distribution of student final scores"
              >
                <ADAPTPerformance data={adaptPerformance || []} />
              </VisualizationContainer>
              <VisualizationContainer
                title="Final Grade Distribution"
                description="Distribution of final student letter grades"
              >
                <GradeDistribution data={gradeDistribution} />
              </VisualizationContainer>
            </>
          ) : (
            <div className="tw:max-w-[96%] tw:mt-4">
              <p className="tw:text-sm tw:text-center tw:text-gray-600">
                Final grades have not been released for this course. Final score and letter grade
                distribution visualizations will be available once grades are released.
              </p>
            </div>
          )}
        </>
      ) : (
        <NoCourseData />
      )}
    </GenericPageContainer>
  )
}

export default InstructorDashboard
