import {
  getPerformancePerAssignment,
  getSubmissionTimeline,
  getTextbookEngagement,
  getADAPTPerformance,
  getGradeDistribution,
  getActivityAccessed,
  getAssignmentFrameworkData,
  checkFinalGradesReleased,
  getTimeInReview,
  getTimeOnTask,
  getLearningObjectiveCompletion,
} from "@/lib/analytics-functions";
import GenericPageContainer from "@/components/GenericPageContainer";
import PageHeader from "@/components/PageHeader";
import SmallMetricCard from "@/components/SmallMetricCard";
import VisualizationContainer from "@/components/VisualizationContainer";
import PerfPerAssignment from "@/components/Visualizations/PerfPerAssignment";
import SubmissionTimeline from "@/components/Visualizations/SubmissionTimeline";
import { useEffect, useState } from "react";
import NoData from "@/components/NoData";
import TextbookEngagement from "@/components/Visualizations/TextbookEngagement";
import TextbookActivity from "@/components/Visualizations/TextbookActivity";
import InstructorQuickMetrics from "@/components/InstructorQuickMetrics";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import ADAPTPerformance from "./Visualizations/ADAPTPerformance";
import InstructorDashboardControls from "./InstructorDashboardControls";
import GradeDistribution from "./Visualizations/GradeDistribution";
import ActivityAccessed from "./Visualizations/StudentActivity";
import LearningObjectiveCompletion from "./LearningObjectiveCompletion";
import TimeInReview from "./Visualizations/TimeInReview";
import TimeOnTask from "./Visualizations/TimeOnTask";

const InstructorDashboard = ({
  course_id,
  letter_grades_released = false,
}: {
  course_id: string;
  letter_grades_released: boolean;
}) => {
  return (
    <GenericPageContainer>
      <PageHeader
        title="Instructor Dashboard"
        subtitle="View analytics and data visualizations for your course. Click on a visualization to view more details."
      />
      <InstructorQuickMetrics course_id={course_id} />
      <VisualizationContainer
        title="Performance"
        description="Class average vs. selected student's scores"
        tooltipDescription="Performance per assignment is the student's score on each assignment, compared to the class average."
      >
        <PerfPerAssignment
          getData={(student_id) =>
            getPerformancePerAssignment(course_id, student_id)
          }
        />
      </VisualizationContainer>
      <VisualizationContainer
        title="Student Activity Per Assignment"
        description="Comparison of student activity on the selected assignment"
      >
        <ActivityAccessed
          getData={(student_id) => getActivityAccessed(course_id, student_id)}
        />
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
        description="Class average vs. selected student's cumulative time on task"
        tooltipDescription="Time on task is the student's time spent working on a question before they submit it."
      >
        <TimeOnTask
          getData={(student_id, assignment_id) =>
            getTimeOnTask(course_id, student_id, assignment_id)
          }
        />
      </VisualizationContainer>
      <VisualizationContainer
        title="Time in Review"
        description="Class average vs. selected student's cumulative time in review"
        tooltipDescription="Time in review is the student's time spent reviewing questions after they have been submitted."
      >
        <TimeInReview
          getData={(student_id, assigment_id) =>
            getTimeInReview(course_id, student_id, assigment_id)
          }
        />
      </VisualizationContainer>
      {/* <VisualizationContainer
        title="Time on Task (Homework)"
        description="Class average vs. selected student's time on task"
      >
        <NoData width={1200} height={400} />
      </VisualizationContainer> */}
      <VisualizationContainer
        title="Submission Activity"
        description="Timeline of student submissions for selected assignment"
        tooltipDescription="A histogram of student submissions over time for the selected assignment."
      >
        <SubmissionTimeline
          getData={(assignment_id) =>
            getSubmissionTimeline(course_id, assignment_id)
          }
        />
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
            <ADAPTPerformance
              getData={(assignment_id) =>
                getADAPTPerformance(course_id, assignment_id)
              }
            />
          </VisualizationContainer>
          <VisualizationContainer
            title="Final Grade Distribution"
            description="Distribution of final student letter grades"
          >
            <GradeDistribution
              getData={() => getGradeDistribution(course_id)}
            />
          </VisualizationContainer>
        </>
      ) : (
        <div className="tw-max-w-[96%] tw-mt-4">
          <p className="tw-text-sm tw-text-center tw-text-gray-600">
            Final grades have not been released for this course. Final score and
            letter grade distribution visualizations will be available once
            grades are released.
          </p>
        </div>
      )}
    </GenericPageContainer>
  );
};

export default InstructorDashboard;
