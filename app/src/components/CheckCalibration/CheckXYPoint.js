// @flow
import * as React from 'react'
import cx from 'classnames'
import { Icon, PrimaryButton, Link, type Mount } from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

import {
  type RobotCalibrationCheckComparison,
  CHECK_TRANSFORM_TYPE_DECK,
} from '../../calibration'
import { JogControls } from '../JogControls'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import styles from './styles.css'
import { formatOffsetValue } from './utils'
import { EndOfStepComparison } from './EndOfStepComparisons'

import slot1LeftMultiDemoAsset from './videos/SLOT_1_LEFT_MULTI_X-Y_(640X480)_REV1.webm'
import slot1LeftSingleDemoAsset from './videos/SLOT_1_LEFT_SINGLE_X-Y_(640X480)_REV1.webm'
import slot1RightMultiDemoAsset from './videos/SLOT_1_RIGHT_MULTI_X-Y_(640X480)_REV1.webm'
import slot1RightSingleDemoAsset from './videos/SLOT_1_RIGHT_SINGLE_X-Y_(640X480)_REV1.webm'
import slot3LeftMultiDemoAsset from './videos/SLOT_3_LEFT_MULTI_X-Y_(640X480)_REV1.webm'
import slot3LeftSingleDemoAsset from './videos/SLOT_3_LEFT_SINGLE_X-Y_(640X480)_REV1.webm'
import slot3RightMultiDemoAsset from './videos/SLOT_3_RIGHT_MULTI_X-Y_(640X480)_REV1.webm'
import slot3RightSingleDemoAsset from './videos/SLOT_3_RIGHT_SINGLE_X-Y_(640X480)_REV1.webm'
import slot7LeftMultiDemoAsset from './videos/SLOT_7_LEFT_MULTI_X-Y_(640X480)_REV1.webm'
import slot7LeftSingleDemoAsset from './videos/SLOT_7_LEFT_SINGLE_X-Y_(640X480)_REV1.webm'
import slot7RightMultiDemoAsset from './videos/SLOT_7_RIGHT_MULTI_X-Y_(640X480)_REV1.webm'
import slot7RightSingleDemoAsset from './videos/SLOT_7_RIGHT_SINGLE_X-Y_(640X480)_REV1.webm'

const assetMap = {
  '1': {
    left: {
      multi: slot1LeftMultiDemoAsset,
      single: slot1LeftSingleDemoAsset,
    },
    right: {
      multi: slot1RightMultiDemoAsset,
      single: slot1RightSingleDemoAsset,
    },
  },
  '3': {
    left: {
      multi: slot3LeftMultiDemoAsset,
      single: slot3LeftSingleDemoAsset,
    },
    right: {
      multi: slot3RightMultiDemoAsset,
      single: slot3RightSingleDemoAsset,
    },
  },
  '7': {
    left: {
      multi: slot7LeftMultiDemoAsset,
      single: slot7LeftSingleDemoAsset,
    },
    right: {
      multi: slot7RightMultiDemoAsset,
      single: slot7RightSingleDemoAsset,
    },
  },
}

const CHECK_POINT_XY_HEADER = 'Check the X and Y-axis in'
const SLOT = 'slot'
const JOG_UNTIL = 'Jog the robot until the tip is'
const JUST_BARELY = 'just barely'
const TOUCHING_THE_CROSS = 'touching the cross in'
const THEN = 'Then'
const CHECK_AXES = 'check x and y-axis'
const TO_DETERMINE_MATCH =
  'to see if the position matches the calibration co-ordinate.'
const EXIT_CHECK = 'Exit robot calibration check'

const BAD_INSPECTING_HEADER = 'Bad calibration data detected'
const GOOD_INSPECTING_HEADER = 'Good calibration'
const BAD_INSPECTING_PREAMBLE =
  'Your current pipette tip position falls outside the acceptable tolerance range for a'
const INSPECTING_COMPARISON =
  "pipette when compared to your robot's saved X and Y-axis calibration coordinates."
const GOOD_INSPECTING_PREAMBLE =
  'Your current pipette tip position falls within the acceptable tolerance range for a '
const DIFFERENCE = 'Difference'
const DECK_CAL_BLURB =
  'To resolve this, you will need to perform deck calibration. Read'
const THIS_ARTICLE = 'this article'
const TO_LEARN = 'to learn more'
const DECK_CAL_ARTICLE_URL =
  'https://support.opentrons.com/en/articles/2687620-get-started-calibrate-the-deck'
const CONTACT_SUPPORT = 'Please contact Opentrons support for next steps.'

type CheckXYPointProps = {|
  slotNumber: string | null,
  isMulti: boolean,
  mount: ?Mount,
  isInspecting: boolean,
  comparison: RobotCalibrationCheckComparison,
  pipetteModel: string,
  nextButtonText: string,
  exit: () => mixed,
  comparePoint: () => void,
  goToNextCheck: () => void,
  jog: (JogAxis, JogDirection, JogStep) => void,
|}
export function CheckXYPoint(props: CheckXYPointProps): React.Node {
  const {
    slotNumber,
    isMulti,
    mount,
    isInspecting,
    comparison,
    pipetteModel,
    exit,
    nextButtonText,
    comparePoint,
    goToNextCheck,
    jog,
  } = props

  const demoAsset = React.useMemo(
    () =>
      slotNumber && assetMap[slotNumber][mount][isMulti ? 'multi' : 'single'],
    [slotNumber, mount, isMulti]
  )

  return (
    <>
      <div className={styles.modal_header}>
        <h3>
          {CHECK_POINT_XY_HEADER}
          &nbsp;
          {`${SLOT} ${slotNumber || ''}`}
        </h3>
      </div>
      {isInspecting ? (
        <CompareXY
          comparison={comparison}
          pipetteModel={pipetteModel}
          goToNextCheck={goToNextCheck}
          exit={exit}
          nextButtonText={nextButtonText}
        />
      ) : (
        <>
          <div className={styles.tip_pick_up_demo_wrapper}>
            <p className={styles.tip_pick_up_demo_body}>
              {JOG_UNTIL}
              <b>&nbsp;{JUST_BARELY}&nbsp;</b>
              {TOUCHING_THE_CROSS}
              <b>&nbsp;{`${SLOT} ${slotNumber || ''}`}.&nbsp;</b>
              <br />
              {THEN}
              <b>&nbsp;{CHECK_AXES}&nbsp;</b>
              {TO_DETERMINE_MATCH}
            </p>
            <div className={styles.step_check_video_wrapper}>
              <video
                key={String(demoAsset)}
                className={styles.step_check_video}
                autoPlay={true}
                loop={true}
                controls={false}
              >
                <source src={demoAsset} />
              </video>
            </div>
          </div>
          <div className={styles.tip_pick_up_controls_wrapper}>
            <JogControls jog={jog} stepSizes={[0.1, 1]} axes={['x', 'y']} />
          </div>
          <div className={styles.button_row}>
            <PrimaryButton
              onClick={comparePoint}
              className={styles.command_button}
            >
              {nextButtonText}
            </PrimaryButton>
          </div>
        </>
      )}
    </>
  )
}

type CompareXYProps = {|
  comparison: RobotCalibrationCheckComparison,
  pipetteModel: string,
  goToNextCheck: () => void,
  exit: () => mixed,
  nextButtonText: string,
|}
function CompareXY(props: CompareXYProps) {
  const {
    comparison,
    pipetteModel,
    goToNextCheck,
    exit,
    nextButtonText,
  } = props
  const { differenceVector, exceedsThreshold } = comparison
  const { displayName } = getPipetteModelSpecs(pipetteModel) || {}
  let header = GOOD_INSPECTING_HEADER
  let preamble = GOOD_INSPECTING_PREAMBLE
  let icon = <Icon name="check-circle" className={styles.success_status_icon} />
  let differenceClass = styles.difference_good

  if (exceedsThreshold) {
    header = BAD_INSPECTING_HEADER
    preamble = BAD_INSPECTING_PREAMBLE
    icon = <Icon name="close-circle" className={styles.error_status_icon} />
    differenceClass = styles.difference_bad
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
      {exceedsThreshold &&
        (comparison.transformType === CHECK_TRANSFORM_TYPE_DECK ? (
          <p className={styles.difference_body}>
            {DECK_CAL_BLURB}
            &nbsp;
            <Link href={DECK_CAL_ARTICLE_URL} external>
              {THIS_ARTICLE}
            </Link>
            &nbsp;
            {TO_LEARN}
          </p>
        ) : (
          <p className={styles.difference_body}>{CONTACT_SUPPORT}</p>
        ))}
      <div className={styles.button_stack}>
        {exceedsThreshold && (
          <PrimaryButton onClick={exit}>{EXIT_CHECK}</PrimaryButton>
        )}
        <PrimaryButton onClick={goToNextCheck}>{nextButtonText}</PrimaryButton>
      </div>
    </div>
  )
}
