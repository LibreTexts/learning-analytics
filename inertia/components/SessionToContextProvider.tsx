import LoadingComponent from './LoadingComponent'
import { useGlobalContext } from '~/state/globalContext'
import { Suspense, useEffect } from 'react'
import api from '~/api'
import { useQuery } from '@tanstack/react-query'
import { Session } from '#types/auth'

interface SessionToContextProviderProps {
  children: React.ReactNode
}

const SessionToContextProvider: React.FC<SessionToContextProviderProps> = ({ children }) => {
  const [globalState, setGlobalState] = useGlobalContext()

  const { data: session, isLoading: sessionLoading } = useQuery<Session>({
    queryKey: ['session'],
    queryFn: async () => {
      const res = await api.getUserSession()
      return res.data
    },
    retry: 1,
  })

  useEffect(() => {
    if (sessionLoading || !session?.user?.id) return
    updateGlobalStateWithSession()
  }, [session])

  useEffect(() => {
    if (!session?.user?.id) return
    fetchCourseData()
  }, [globalState.courseID, session])

  async function fetchCourseData() {
    const hasData = await fetchCourseHasData()
    if (!hasData) return
    fetchLetterGradesReleased()
    fetchCourseSettings()
  }

  async function updateGlobalStateWithSession() {
    if (!session?.user) return
    const role =
      session.user.role === 'instructor' ? 'instructor' : ('student' as 'instructor' | 'student')

    const toSet = {
      ...globalState,
      role: session.user.role,
      courseID: session.user.courses[session.user.courses.length - 1] ?? '', // use last accessed course
      viewAs: role,
      ...(role === 'student' && {
        student: {
          id: session.user.id,
          email: session.user.email || '',
          name: '',
        },
      }),
    }

    setGlobalState(toSet)
  }

  async function fetchCourseHasData(): Promise<boolean> {
    try {
      if (!globalState.courseID) return false

      const res = await api.getHasData(globalState.courseID)
      if (!res.data) return false

      setGlobalState((prev) => ({
        ...prev,
        hasData: res.data.hasData,
      }))

      return res.data.hasData
    } catch (error) {
      console.error(error)
      return false
    }
  }

  async function fetchLetterGradesReleased() {
    try {
      if (!globalState.courseID) return
      const res = await api.getCourse(globalState.courseID)
      if (!res.data) return

      setGlobalState((prev) => ({
        ...prev,
        courseLetterGradesReleased: res.data.final_grades_released ?? false,
      }))
    } catch (error) {
      console.error(error)
    }
  }

  async function fetchCourseSettings() {
    try {
      if (!globalState.courseID) return
      const res = await api.getCourseAnalyticsSettings(globalState.courseID)
      if (!res) return

      setGlobalState((prev) => ({
        ...prev,
        shareGradeDistribution: res.data.shareGradeDistribution,
        frameworkExclusions: res.data.frameworkExclusions,
        assignmentExclusions: res.data.assignmentExclusions,
      }))
    } catch (err) {
      console.error(err)
    }
  }

  return <Suspense fallback={<LoadingComponent />}>{children}</Suspense>
}

export default SessionToContextProvider
