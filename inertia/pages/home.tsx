import InstructorDashboard from '~/components/InstructorDashboard'
import StudentDashboard from '~/components/StudentDashboard'
import { Suspense } from 'react'
import LoadingComponent from '~/components/LoadingComponent'
import { useGlobalContext } from '~/state/globalContext'

export default function Dashboard() {
  const [globalState] = useGlobalContext()

  return (
    <Suspense fallback={<LoadingComponent />}>
      {globalState.viewAs === 'instructor' ? (
        <InstructorDashboard
          course_id={globalState.courseID}
          student_id={globalState.student?.id || null}
          assignment_id={globalState.assignmentId || null}
          letter_grades_released={globalState.courseLetterGradesReleased}
          has_data={globalState.hasData}
        />
      ) : (
        <StudentDashboard
          course_id={globalState.courseID}
          student_id={globalState.student?.id}
          has_data={globalState.hasData}
        />
      )}
    </Suspense>
  )
}
