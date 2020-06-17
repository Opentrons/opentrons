// @flow
import * as React from 'react'
import { PrimaryButton, OutlineButton } from '@opentrons/components'
import find from 'lodash/find'
import pick from 'lodash/pick'
import partition from 'lodash/partition'
import type {
  RobotCalibrationCheckComparisonsByStep,
  RobotCalibrationCheckInstrument,
} from '../../calibration'
import * as Calibration from '../../calibration'
import styles from './styles.css'
import { PipetteComparisons } from './PipetteComparisons'

const ROBOT_CALIBRATION_CHECK_SUMMARY_HEADER = 'Calibration check summary:'
const DROP_TIP_AND_EXIT = 'Drop tip in trash and exit'
const DOWNLOAD_SUMMARY = 'Copy JSON summary to clipboard'

type ResultsSummaryProps = {|
  deleteSession: () => mixed,
  comparisonsByStep: RobotCalibrationCheckComparisonsByStep,
  instrumentsByMount: { [mount: string]: RobotCalibrationCheckInstrument, ... },
|}
export function ResultsSummary(props: ResultsSummaryProps): React.Node {
  const { deleteSession, comparisonsByStep, instrumentsByMount } = props

  const rawDataRef = React.useRef<HTMLInputElement | null>(null)
  const handleCopyButtonClick = () => {
    if (rawDataRef.current) {
      rawDataRef.current.select()
      document.execCommand('copy')
    }
  }

  const firstPipette = find(
    instrumentsByMount,
    (p: RobotCalibrationCheckInstrument) =>
      p.rank === Calibration.CHECK_PIPETTE_RANK_FIRST
  )
  const secondPipette = find(
    instrumentsByMount,
    (p: RobotCalibrationCheckInstrument) =>
      p.rank === Calibration.CHECK_PIPETTE_RANK_SECOND
  )
  const [firstComparisonsByStep, secondComparisonsByStep] = partition(
    Object.keys(comparisonsByStep),
    compStep => Calibration.FIRST_PIPETTE_COMPARISON_STEPS.includes(compStep)
  ).map(stepNames => pick(comparisonsByStep, stepNames))

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
            allSteps={Calibration.FIRST_PIPETTE_COMPARISON_STEPS}
          />
        </div>
        {secondPipette && (
          <div className={styles.summary_section}>
            <PipetteComparisons
              pipette={secondPipette}
              comparisonsByStep={secondComparisonsByStep}
              allSteps={Calibration.SECOND_PIPETTE_COMPARISON_STEPS}
            />
          </div>
        )}

        <input
          ref={rawDataRef}
          type="text"
          value={JSON.stringify(comparisonsByStep)}
          onFocus={e => e.currentTarget.select()}
          readOnly
          style={{ opacity: 0 }}
        />
      </div>
      <OutlineButton
        className={styles.download_summary_button}
        onClick={handleCopyButtonClick}
      >
        {DOWNLOAD_SUMMARY}
      </OutlineButton>
      <PrimaryButton onClick={deleteSession}>{DROP_TIP_AND_EXIT}</PrimaryButton>
    </>
  )
}
