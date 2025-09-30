import { truncateString } from '~/utils/text-helpers'
import { useId } from 'react'
import { Dropdown, DropdownProps } from 'react-bootstrap'
import { FileEarmarkTextFill, Person, PersonFill, QuestionCircle } from 'react-bootstrap-icons'
import classNames from 'classnames'

interface CustomDropdownProps extends DropdownProps {
  icon: 'file' | 'person' | 'question'
  toggleClassName?: string
  labelLength?: number
  children: React.ReactNode
  label: string
  loading?: boolean
  disabled?: boolean
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  icon,
  children,
  toggleClassName,
  labelLength = 30,
  label,
  loading,
  disabled,
  ...props
}) => {
  const id = useId()
  return (
    <Dropdown {...props} id={id}>
      <Dropdown.Toggle
        variant="light"
        disabled={disabled || loading}
        className={classNames(
          'tw:!flex tw:!items-center tw:!justify-center tw:!text-truncate tw:!align-middle',
          toggleClassName
        )}
      >
        {loading ? (
          <div className="spinner-border spinner-border-sm tw:mr-1" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        ) : icon === 'file' ? (
          <FileEarmarkTextFill className="tw:mr-1" />
        ) : icon === 'person' ? (
          <PersonFill className="tw:mr-1" />
        ) : (
          <QuestionCircle className="tw:mr-1" />
        )}
        <span className="">{truncateString(label, labelLength)}</span>
      </Dropdown.Toggle>
      <Dropdown.Menu className="tw:max-h-80 tw:overflow-y-auto tw:overflow-x-hidden">
        {children}
      </Dropdown.Menu>
    </Dropdown>
  )
}

export default CustomDropdown
