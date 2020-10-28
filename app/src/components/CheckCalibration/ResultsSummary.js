// @flow
import * as React from 'react'
import {
  PrimaryButton,
  OutlineButton,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import find from 'lodash/find'
import * as Sessions from '../../sessions'
import styles from './styles.css'
import { PipetteComparisons } from './PipetteComparisons'
import { saveAs } from 'file-saver'
import { NeedHelpLink } from '../CalibrationPanels/NeedHelpLink'

import type { CalibrationPanelProps } from '../CalibrationPanels/types'
import type { CalibrationHealthCheckInstrument } from '../../sessions/types'

const ROBOT_CALIBRATION_CHECK_SUMMARY_HEADER = 'Calibration check summary:'
const HOME_AND_EXIT = 'Home robot and exit'
const DOWNLOAD_SUMMARY = 'Download JSON summary'

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
  const firstComparisonsByStep = firstPipette
    ? comparisonsByPipette?.first
    : null
  const secondComparisonsByStep = secondPipette
    ? comparisonsByPipette?.second
    : null

  // TODO (lc 10-20-2020): Rather than having the app decide
  // what the last failed comparison was, the robot should
  // just send a final report over to the app to decipher.

  return (
    <>
      <Flex width="100%" justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <h3 className={styles.summary_page_header}>
          {ROBOT_CALIBRATION_CHECK_SUMMARY_HEADER}
        </h3>
        <NeedHelpLink maxHeight="1rem" />
      </Flex>
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

      <PrimaryButton
        className={styles.summary_exit_button}
        onClick={cleanUpAndExit}
      >
        {HOME_AND_EXIT}
      </PrimaryButton>
    </>
  )
}
