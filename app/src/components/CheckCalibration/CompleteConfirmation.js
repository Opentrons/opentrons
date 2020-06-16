// @flow
import * as React from 'react'
import { PrimaryButton, OutlineButton } from '@opentrons/components'
import find from 'lodash/find'
import pick from 'lodash/pick'
import some from 'lodash/some'
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
const DOWNLOAD_SUMMARY = 'Download JSON summary'

type CompleteConfirmationProps = {|
  exit: () => mixed,
  comparisonsByStep: RobotCalibrationCheckComparisonsByStep,
  instrumentsByMount: { [mount: string]: RobotCalibrationCheckInstrument, ... },
|}
export function CompleteConfirmation(
  props: CompleteConfirmationProps
): React.Node {
  const { exit, comparisonsByStep, instrumentsByMount } = props

  const rawDataRef = React.useRef<HTMLInputElement | null>(null)
  const handleCopyButtonClick = () => {
    console.log(rawDataRef.current)
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

  console.log(firstComparisonsByStep, secondComparisonsByStep)
  return (
    <>
      <h3 className={styles.summary_page_header}>
        {ROBOT_CALIBRATION_CHECK_SUMMARY_HEADER}
      </h3>

      <div className={styles.summary_page_contents}>
        {some(firstComparisonsByStep) && (
          <div className={styles.summary_section}>
            <PipetteComparisons
              pipette={firstPipette}
              comparisonsByStep={firstComparisonsByStep}
            />
          </div>
        )}
        {some(secondComparisonsByStep) && (
          <div className={styles.summary_section}>
            <PipetteComparisons
              pipette={secondPipette}
              comparisonsByStep={secondComparisonsByStep}
            />
          </div>
        )}

        <input
          ref={rawDataRef}
          type="text"
          value={JSON.stringify(comparisonsByStep)}
          onFocus={e => e.currentTarget.select()}
          readOnly
          hidden
        />
      </div>
      <OutlineButton
        className={styles.download_summary_button}
        onClick={handleCopyButtonClick}
      >
        {DOWNLOAD_SUMMARY}
      </OutlineButton>
      <PrimaryButton onClick={exit}>{DROP_TIP_AND_EXIT}</PrimaryButton>
    </>
  )
}
