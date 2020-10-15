// @flow
import * as React from 'react'
import { Icon, PrimaryButton } from '@opentrons/components'

import { getPipetteModelSpecs } from '@opentrons/shared-data'

import { getBadOutcomeHeader } from './utils'
import styles from './styles.css'
import { EndOfStepComparison } from './EndOfStepComparisons'
import { BadOutcomeBody } from './BadOutcomeBody'
import type { CalibrationHealthCheckComparison } from './types'

const EXIT_CHECK = 'Exit robot calibration check'

const GOOD_INSPECTING_HEADER = 'Good calibration'
const BAD_INSPECTING_PREAMBLE =
  'Your current pipette tip position falls outside the acceptable tolerance range for a'
const INSPECTING_COMPARISON =
  "pipette when compared to your robot's saved X and Y-axis calibration coordinates."
const GOOD_INSPECTING_PREAMBLE =
  'Your current pipette tip position falls within the acceptable tolerance range for a '
const CONTINUE_BLURB = 'You may also continue forward to the next check.'

type CompareXYProps = {|
  comparison: CalibrationHealthCheckComparison,
  pipetteModel: string,
  goToNextCheck: () => void,
  exit: () => mixed,
  nextButtonText: string,
|}
export function CompareXY(props: CompareXYProps) {
  const {
    comparison,
    pipetteModel,
    goToNextCheck,
    exit,
    nextButtonText,
  } = props
  const { exceedsThreshold, transformType } = comparison
  const { displayName } = getPipetteModelSpecs(pipetteModel) || {}
  let header = GOOD_INSPECTING_HEADER
  let preamble = GOOD_INSPECTING_PREAMBLE
  let icon = <Icon name="check-circle" className={styles.success_status_icon} />

  if (exceedsThreshold) {
    header = getBadOutcomeHeader(transformType)
    preamble = BAD_INSPECTING_PREAMBLE
    icon = <Icon name="close-circle" className={styles.error_status_icon} />
  }

  return (
    <div className={styles.padded_contents_wrapper}>
      <div className={styles.modal_icon_wrapper}>
        {icon}
        <h3>{header}</h3>
      </div>
      <p className={styles.difference_body}>
        {preamble}
        &nbsp;
        {displayName}
        &nbsp;
        {INSPECTING_COMPARISON}
      </p>
      <EndOfStepComparison comparison={comparison} forAxes={['x', 'y']} />
      {exceedsThreshold && (
        <>
          <p className={styles.difference_body}>
            <BadOutcomeBody transform={transformType} />
          </p>
          <p className={styles.difference_body}>{CONTINUE_BLURB}</p>
        </>
      )}
      <div className={styles.button_stack}>
        {exceedsThreshold && (
          <PrimaryButton onClick={exit}>{EXIT_CHECK}</PrimaryButton>
        )}
        <PrimaryButton onClick={goToNextCheck}>{nextButtonText}</PrimaryButton>
      </div>
    </div>
  )
}
