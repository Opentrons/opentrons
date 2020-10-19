// @flow
import * as React from 'react'
import { PrimaryButton, OutlineButton } from '@opentrons/components'
import find from 'lodash/find'
import * as Sessions from '../../sessions'
import styles from './styles.css'
import { PipetteComparisons } from './PipetteComparisons'
import { BadOutcomeBody } from './BadOutcomeBody'
import { saveAs } from 'file-saver'
import { getBadOutcomeHeader } from './utils'

import type { CalibrationPanelProps } from '../CalibrationPanels/types'
import type {
  CalibrationHealthCheckComparison,
  CalibrationHealthCheckInstrument,
} from '../../sessions/types'

const ROBOT_CALIBRATION_CHECK_SUMMARY_HEADER = 'Calibration check summary:'
const DROP_TIP_AND_EXIT = 'Drop tip in trash and exit'
const DOWNLOAD_SUMMARY = 'Download JSON summary'
const STILL_HAVING_PROBLEMS =
  'If you are still experiencing issues, please download the JSON summary and share it with our support team who will then follow up with you.'

export function ResultsSummary(props: CalibrationPanelProps): React.Node {
  const { comparisonsByPipette, instruments, cleanUpAndExit } = props

  const handleDownloadButtonClick = () => {
    const now = new Date()
    const report = {
      comparisonsByPipette,
      instruments,
      savedAt: now.toISOString(),
    }
    const data = new Blob([JSON.stringify(report)], {
      type: 'application/json',
    })
    saveAs(data, 'OT-2 Robot Calibration Check Report.json')
  }

  const firstPipette = find(
    instruments,
    (p: CalibrationHealthCheckInstrument) =>
      p.rank === Sessions.CHECK_PIPETTE_RANK_FIRST
  )
  const secondPipette = find(
    instruments,
    (p: CalibrationHealthCheckInstrument) =>
      p.rank === Sessions.CHECK_PIPETTE_RANK_SECOND
  )
  const firstComparisonsByStep = comparisonsByPipette?.first
  const secondComparisonsByStep = comparisonsByPipette?.second

  const lastFailedComparison = [
    ...Sessions.FIRST_PIPETTE_COMPARISON_STEPS,
  ].reduce((acc, step): CalibrationHealthCheckComparison | null => {
    const first_pipette_comparison = comparisonsByPipette?.first[step]
    const second_pipette_comparison = comparisonsByPipette?.second[step]
    if (
      second_pipette_comparison &&
      second_pipette_comparison.exceedsThreshold
    ) {
      // We must first check if a comparison for the second
      // pipette exists and return that, otherwise check
      // the first pipette's steps.
      return second_pipette_comparison
    } else if (
      first_pipette_comparison &&
      first_pipette_comparison.exceedsThreshold
    ) {
      return first_pipette_comparison
    } else {
      return acc
    }
  }, null)

  return (
    <>
      <h3 className={styles.summary_page_header}>
        {ROBOT_CALIBRATION_CHECK_SUMMARY_HEADER}
      </h3>

      <div className={styles.summary_page_contents}>
        <div className={styles.summary_section}>
          {firstPipette && firstComparisonsByStep && (
            <PipetteComparisons
              pipette={firstPipette}
              comparisonsByStep={firstComparisonsByStep}
              allSteps={Sessions.FIRST_PIPETTE_COMPARISON_STEPS}
            />
          )}
        </div>
        {secondPipette && secondComparisonsByStep && (
          <div className={styles.summary_section}>
            <PipetteComparisons
              pipette={secondPipette}
              comparisonsByStep={secondComparisonsByStep}
              allSteps={Sessions.SECOND_PIPETTE_COMPARISON_STEPS}
            />
          </div>
        )}
      </div>
      <OutlineButton
        className={styles.download_summary_button}
        onClick={handleDownloadButtonClick}
      >
        {DOWNLOAD_SUMMARY}
      </OutlineButton>
      {lastFailedComparison && (
        <TroubleshootingInstructions comparison={lastFailedComparison} />
      )}

      <PrimaryButton
        className={styles.summary_exit_button}
        onClick={cleanUpAndExit}
      >
        {DROP_TIP_AND_EXIT}
      </PrimaryButton>
    </>
  )
}

type TroubleshootingInstructionsProps = {
  comparison: CalibrationHealthCheckComparison,
}
function TroubleshootingInstructions(
  props: TroubleshootingInstructionsProps
): React.Node {
  const { comparison } = props
  return (
    <div>
      <p className={styles.summary_bad_outcome_header}>
        {getBadOutcomeHeader(comparison.transformType)}
      </p>
      <p className={styles.summary_bad_outcome_body}>
        <BadOutcomeBody transform={comparison.transformType} />
      </p>
      <p className={styles.summary_bad_outcome_body}>{STILL_HAVING_PROBLEMS}</p>
    </div>
  )
}
