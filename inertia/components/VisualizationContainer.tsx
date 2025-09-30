import React, { cloneElement, useEffect, useRef, useState } from 'react'
import { Button, Card, OverlayTrigger, Tooltip } from 'react-bootstrap'
import {
  Download as IconDownload,
  Table as IconTable,
  BarChart as IconBarChart,
  InfoCircle as IconInfoCircle,
} from 'react-bootstrap-icons'
import { VisualizationInnerRef } from '#types/index'
import { useGlobalContext } from '~/state/globalContext'
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from '~/utils/visualization-helpers'

interface VisualizationContainerProps {
  title: string
  description: string
  tooltipDescription?: string
  children: React.ReactNode
  studentMode?: boolean
}

const VisualizationContainer: React.FC<VisualizationContainerProps> = ({
  title,
  description,
  tooltipDescription,
  children,
  studentMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<VisualizationInnerRef | null>(null)
  const [tableView, setTableView] = useState(false)
  const [globalState] = useGlobalContext()
  const [width, setWidth] = useState<number>(0)
  const [height, setHeight] = useState<number>(0)

  useEffect(() => {
    if (tableView) return
    // set default width and height if tableView is false
    setWidth(DEFAULT_WIDTH)
    setHeight(DEFAULT_HEIGHT)
  }, [tableView])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width ?? DEFAULT_WIDTH)
        setHeight(entry.contentRect.height ?? DEFAULT_HEIGHT)
      }
    })
    observer.observe(containerRef.current as Element)
  }, [containerRef.current])

  const childWithProps = cloneElement(children as React.ReactElement, {
    selectedStudent: globalState.student,
    selectedAssignmentId: globalState.assignmentId,
    studentMode,
    tableView,
    innerRef,
    width: width < 100 ? DEFAULT_WIDTH : width, // if width < 100, something has likely gone wrong, set to default
    height: height < 100 ? DEFAULT_HEIGHT : height, // if width < 100, something has likely gone wrong, set to default
  })

  const handleDownloadImg = () => {
    if (!innerRef.current) return
    const svg = innerRef.current.getSVG()
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const svgSize = svg.getBoundingClientRect()
    canvas.width = svgSize.width
    canvas.height = svgSize.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0)
      const a = document.createElement('a')
      a.download = 'visualization.png'
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <Card className="tw:mt-4 tw:rounded-lg tw:shadow-sm tw:px-4 tw:pt-4 tw:pb-2 tw:max-w-[96%]">
      <div className="tw:flex tw:flex-row tw:justify-between">
        <div className="tw:flex tw:flex-col">
          <div className="tw:flex tw:flex-row tw:mb-0 tw:items-center">
            <h3 className="tw:text-2xl tw:font-semibold">{title}</h3>
            {tooltipDescription && (
              <OverlayTrigger overlay={<Tooltip>{tooltipDescription}</Tooltip>}>
                <IconInfoCircle className="tw:text-gray-500 tw:ml-1.5 tw:mb-1.5" />
              </OverlayTrigger>
            )}
          </div>
          <p className="tw:text-xs tw:text-gray-500 tw:mt-0">{description}</p>
        </div>
      </div>
      <div ref={containerRef} className="tw:rounded-md tw:min-h-96">
        {childWithProps}
      </div>
      <div className="tw:flex tw:flex-row tw:justify-end tw:items-end tw:mt-0.5 tw:w-full">
        {!tableView && (
          <Button className="" variant="light" onClick={handleDownloadImg}>
            <IconDownload />
          </Button>
        )}
        <Button className="tw:!ml-2" variant="light" onClick={() => setTableView(!tableView)}>
          {tableView ? <IconBarChart /> : <IconTable />}
        </Button>
      </div>
    </Card>
  )
}

export default VisualizationContainer
