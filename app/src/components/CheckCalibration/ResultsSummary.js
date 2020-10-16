// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { PrimaryButton, OutlineButton } from '@opentrons/components'
import find from 'lodash/find'
import type { State } from '../../types'
import * as Sessions from '../../sessions'
import * as Calibration from '../../calibration'
import styles from './styles.css'
import { PipetteComparisons } from './PipetteComparisons'
import { BadOutcomeBody } from './BadOutcomeBody'
import { saveAs } from 'file-saver'
import { getBadOutcomeHeader } from './utils'

import type { CalibrationStatus } from '../../calibration/types'
import type {
  CalibrationHealthCheckComparisonByPipette,
  CalibrationHealthCheckComparison,
  CalibrationHealthCheckInstrument,
} from '../../sessions/types'

const ROBOT_CALIBRATION_CHECK_SUMMARY_HEADER = 'Calibration check summary:'
const DROP_TIP_AND_EXIT = 'Drop tip in trash and exit'
const DOWNLOAD_SUMMARY = 'Download JSON summary'
const STILL_HAVING_PROBLEMS =
  'If you are still experiencing issues, please download the JSON summary and share it with our support team who will then follow up with you.'

type ResultsSummaryProps = {|
  robotName: string,
  deleteSession: () => mixed,
  comparisonsByPipette: CalibrationHealthCheckComparisonByPipette,
  instrumentList: Array<CalibrationHealthCheckInstrument>,
|}
export function ResultsSummary(props: ResultsSummaryProps): React.Node {
  const {
    robotName,
    deleteSession,
    comparisonsByPipette,
    instrumentList,
  } = props

  const calibrationStatus = useSelector<State, CalibrationStatus | null>(
    state => Calibration.getCalibrationStatus(state, robotName)
  )

  const handleDownloadButtonClick = () => {
    const now = new Date()
    const report = {
      comparisonsByPipette,
      instrumentList,
      calibrationStatus,
      savedAt: now.toISOString(),
    }
    const data = new Blob([JSON.stringify(report)], {
      type: 'application/json',
    })
    saveAs(data, 'OT-2 Robot Calibration Check Report.json')
  }

  const firstPipette = find(
    instrumentList,
    (p: CalibrationHealthCheckInstrument) =>
      p.rank === Sessions.CHECK_PIPETTE_RANK_FIRST
  )
  const secondPipette = find(
    instrumentList,
    (p: CalibrationHealthCheckInstrument) =>
      p.rank === Sessions.CHECK_PIPETTE_RANK_SECOND
  )
  const firstComparisonsByStep = comparisonsByPipette.first
  const secondComparisonsByStep = comparisonsByPipette.second

  const lastFailedComparison = [
    ...Sessions.FIRST_PIPETTE_COMPARISON_STEPS,
  ].reduce((acc, step): CalibrationHealthCheckComparison | null => {
    const first_pipette_comparison = comparisonsByPipette.first[step]
    const second_pipette_comparison = comparisonsByPipette.second[step]
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
          <PipetteComparisons
            pipette={firstPipette}
            comparisonsByStep={firstComparisonsByStep}
            allSteps={Sessions.FIRST_PIPETTE_COMPARISON_STEPS}
          />
        </div>
        {secondPipette && (
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
        onClick={deleteSession}
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
