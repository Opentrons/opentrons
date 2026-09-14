import { useRef } from 'react'

import { Box } from '../../primitives'
import styles from './stepmeter.module.css'

import type { ReactNode } from 'react'

interface StepMeterProps {
  totalSteps: number
  currentStep: number | null
}

export const StepMeter = (props: StepMeterProps): ReactNode => {
  const { totalSteps, currentStep } = props
  const prevPercentComplete = useRef(0)
  const progress = currentStep ?? 0
  const percentComplete =
    //    this logic puts a cap at 100% percentComplete which we should never run into
    currentStep != null && currentStep > totalSteps
      ? 100
      : (progress / totalSteps) * 100

  const shouldAnimate = prevPercentComplete.current <= percentComplete
  prevPercentComplete.current = percentComplete

  const stepMeterBarClasses = shouldAnimate
    ? `${styles.step_meter_bar} ${styles.step_meter_bar_animated}`
    : styles.step_meter_bar

  return (
    <Box
      data-testid="StepMeter_StepMeterContainer"
      className={styles.step_meter_container}
    >
      <Box
        data-testid="StepMeter_StepMeterBar"
        className={stepMeterBarClasses}
        style={{ width: `${percentComplete}%` }}
      />
    </Box>
  )
}
