import * as React from 'react'
import { Slideout } from './index'

interface MultiSlideoutProps {
  title: string | React.ReactElement
  children: React.ReactNode
  onCloseClick: () => void
  currentStep: number
  maxSteps: number
  //  isExpanded is for collapse and expand animation
  isExpanded?: boolean
  footer?: React.ReactNode
}

export const MultiSlideout = (props: MultiSlideoutProps): JSX.Element => {
  const {
    isExpanded,
    title,
    onCloseClick,
    children,
    footer,
    maxSteps,
    currentStep,
  } = props

  return (
    <Slideout
      title={title}
      isExpanded={isExpanded}
      footer={footer}
      onCloseClick={onCloseClick}
      multiSlideoutSpecs={{ currentStep, maxSteps }}
    >
      {children}
    </Slideout>
  )
}
