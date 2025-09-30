import { ListGroup } from 'react-bootstrap'
import Links from '../Links'
import { useMemo } from 'react'
import { useGlobalContext } from '~/state/globalContext'
import DashboardControls from '../DashboardControls'
import { Link } from '@inertiajs/react'

const ACTIVE_CLASSES = 'tw:!bg-light-gray tw:!border-none'

const NavMenu = () => {
  const [globalState] = useGlobalContext()

  const isActive = useMemo(() => {
    const pathname = window.location.pathname
    return (key: string) => {
      if (pathname === '/' && key === 'dashboard') return true
      let _pathname
      if (pathname.startsWith('/')) _pathname = pathname.substring(1)
      return key === _pathname
    }
  }, [window.location.pathname])

  if (window.location.pathname === '/login') {
    return <div className="tw:w-52"></div>
  }

  return (
    <div className="tw:w-52">
      <div className="tw:sticky tw:top-4 tw:z-50">
        <ListGroup className="!tw:shadow-sm tw:h-fit">
          <ListGroup.Item className="tw:!bg-ultra-light-gray">Course Analytics</ListGroup.Item>
          <ListGroup.Item
            active={isActive('dashboard')}
            className={isActive('dashboard') ? ACTIVE_CLASSES : ''}
            as={Link}
            href={Links.CLIENT.Dashboard}
          >
            <span className="tw:!text-link-blue">
              {globalState.viewAs === 'instructor' ? 'Performance & Activity' : 'Student Dashboard'}
            </span>
          </ListGroup.Item>
          {globalState.viewAs === 'instructor' && (
            <ListGroup.Item
              active={isActive('learning-curves')}
              className={isActive('learning-curves') ? ACTIVE_CLASSES : ''}
              as={Link}
              href={Links.CLIENT.LearningCurves}
            >
              <span className="tw:!text-link-blue">Learning Curves</span>
            </ListGroup.Item>
          )}
          {globalState.viewAs === 'instructor' && (
            <ListGroup.Item
              active={isActive('learning-objectives')}
              className={isActive('learning-objectives') ? ACTIVE_CLASSES : ''}
              as={Link}
              href={Links.CLIENT.LearningObjectives}
            >
              <span className="tw:!text-link-blue">Learning Objectives</span>
            </ListGroup.Item>
          )}
          {globalState.viewAs === 'instructor' && (
            <ListGroup.Item
              active={isActive('early-warning')}
              className={isActive('early-warning') ? ACTIVE_CLASSES : ''}
              as={Link}
              href={Links.CLIENT.EarlyWarning}
            >
              <span className="tw:!text-link-blue">Early Warning</span>
            </ListGroup.Item>
          )}
          {globalState.viewAs === 'instructor' && (
            <ListGroup.Item
              active={isActive('raw-data')}
              className={isActive('raw-data') ? ACTIVE_CLASSES : ''}
              as={Link}
              href={Links.CLIENT.RawData}
            >
              <span className="tw:!text-link-blue">Raw Data</span>
            </ListGroup.Item>
          )}
          {globalState.viewAs === 'instructor' && (
            <ListGroup.Item
              active={isActive('course-settings')}
              className={isActive('course-settings') ? ACTIVE_CLASSES : ''}
              as={Link}
              href={Links.CLIENT.CourseSettings}
            >
              <span className="tw:!text-link-blue">Course Settings</span>
            </ListGroup.Item>
          )}
        </ListGroup>
        {isActive('dashboard') && globalState.role === 'instructor' && (
          <DashboardControls context={globalState.viewAs} />
        )}
      </div>
    </div>
  )
}

export default NavMenu
