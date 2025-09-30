import LoadingComponent from './LoadingComponent'
import { useGlobalContext } from '~/state/globalContext'
import { Suspense, useEffect, useState } from 'react'
import api from '~/api'

interface SessionToContextProviderProps {
  children: React.ReactNode
}

const SessionToContextProvider: React.FC<SessionToContextProviderProps> = ({ children }) => {
  const [globalState, setGlobalState] = useGlobalContext()
  const [validSession, setValidSession] = useState<boolean>(false)

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (!validSession) return
    fetchCourseData()
  }, [globalState.courseID, validSession])

  async function fetchUserData() {
    const sessionData = await fetchSessionData()
    if (sessionData) {
      setValidSession(true)
    }
  }

  async function fetchCourseData() {
    const hasData = await fetchCourseHasData()
    if (!hasData) return
    fetchLetterGradesReleased()
    fetchCourseSettings()
  }

  async function fetchSessionData() {
    const res = await api.getUserSession()
    if (!res.data?.user) return

    const role =
      res.data.user.role === 'instructor' ? 'instructor' : ('student' as 'instructor' | 'student')

    const toSet = {
      ...globalState,
      role: res.data.user.role,
      courseID: res.data.user.courses[0] ?? '',
      viewAs: role,
      ...(role === 'student' && {
        student: {
          id: res.data.user.id,
          email: res.data.user.email || '',
          name: '',
        },
      }),
    }

    setGlobalState(toSet)
    return toSet
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
