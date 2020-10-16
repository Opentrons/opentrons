// @flow
import * as React from 'react'
import { PrimaryButton, Icon } from '@opentrons/components'

import { getPipetteModelSpecs } from '@opentrons/shared-data'

import styles from './styles.css'
import { getBadOutcomeHeader } from './utils'
import { EndOfStepComparison } from './EndOfStepComparisons'
import { BadOutcomeBody } from './BadOutcomeBody'
import type { CalibrationHealthCheckComparison } from '../../sessions/types'

const EXIT_CALIBRATION_CHECK = 'exit robot calibration check'

const GOOD_INSPECTING_HEADER = 'Good calibration'
const BAD_INSPECTING_PREAMBLE =
  'Your current pipette tip position falls outside the acceptable tolerance range for a'
const GOOD_INSPECTING_PREAMBLE =
  'Your current pipette tip position falls within the acceptable tolerance range for a '
const INSPECTING_COMPARISON =
  "pipette when compared to your robot's saved Z-axis calibration coordinates."
const CONTINUE_BLURB = 'You may also continue forward to the next check.'

type CompareZProps = {|
  comparison: CalibrationHealthCheckComparison,
  goToNextCheck: () => void,
  pipetteModel: string,
  exit: () => mixed,
  nextButtonText: string,
|}
export function CompareZ(props: CompareZProps): React.Node {
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
      <EndOfStepComparison comparison={comparison} forAxes={['z']} />
      {exceedsThreshold && (
        <>
          <p className={styles.difference_body}>
            <BadOutcomeBody transform={comparison.transformType} />
          </p>
          <p className={styles.difference_body}>{CONTINUE_BLURB}</p>
        </>
      )}
      <div className={styles.button_stack}>
        {exceedsThreshold && (
          <PrimaryButton onClick={exit}>{EXIT_CALIBRATION_CHECK}</PrimaryButton>
        )}
        <PrimaryButton onClick={goToNextCheck}>{nextButtonText}</PrimaryButton>
      </div>
    </div>
  )
}
