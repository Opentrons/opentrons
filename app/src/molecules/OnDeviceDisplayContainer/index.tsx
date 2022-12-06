import * as React from 'react'
import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import { StepMeter } from '../../atoms/StepMeter'

interface OnDeviceDisplayContainerProps {
  isStepMeter?: boolean
  totalSteps?: number
  currentStep?: number
  headerContent?: React.ReactNode
  bodyContent: React.ReactNode
  footerContent?: React.ReactNode
}

export function OnDeviceDisplayContainer(
  props: OnDeviceDisplayContainerProps
): JSX.Element {
  const {
    isStepMeter,
    totalSteps,
    currentStep,
    headerContent,
    bodyContent,
    footerContent,
  } = props

  return (
    <>
      {isStepMeter ? (
        <StepMeter
          totalSteps={totalSteps ?? 0}
          currentStep={currentStep ?? 0}
          OnDevice
        />
      ) : null}
      <Flex
        padding={`${String(SPACING.spacing6)} ${String(
          SPACING.spacingXXL
        )} ${String(SPACING.spacingXXL)}`}
        flexDirection={DIRECTION_COLUMN}
      >
        {headerContent != null ? headerContent : null}
        {bodyContent}
      </Flex>
    </>
  )
}
