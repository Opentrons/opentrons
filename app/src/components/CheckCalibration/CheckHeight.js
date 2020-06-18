// @flow
import * as React from 'react'
import { PrimaryButton, Icon, Link, type Mount } from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

import {
  type RobotCalibrationCheckComparison,
  CHECK_TRANSFORM_TYPE_DECK,
  CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET,
  CHECK_TRANSFORM_TYPE_UNKNOWN,
  type CHECK_TRANSFORM_TYPE,
} from '../../calibration'
import { JogControls } from '../JogControls'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import styles from './styles.css'
import { EndOfStepComparison } from './EndOfStepComparisons'

import slot5LeftMultiDemoAsset from './videos/SLOT_5_LEFT_MULTI_Z.webm'
import slot5LeftSingleDemoAsset from './videos/SLOT_5_LEFT_SINGLE_Z.webm'
import slot5RightMultiDemoAsset from './videos/SLOT_5_RIGHT_MULTI_Z.webm'
import slot5RightSingleDemoAsset from './videos/SLOT_5_RIGHT_SINGLE_Z.webm'

const assetMap = {
  left: {
    multi: slot5LeftMultiDemoAsset,
    single: slot5LeftSingleDemoAsset,
  },
  right: {
    multi: slot5RightMultiDemoAsset,
    single: slot5RightSingleDemoAsset,
  },
}

const CHECK_Z_HEADER = 'check z-axis in slot 5'

const JOG_UNTIL = 'Jog the pipette until the tip is'
const JUST_BARELY_TOUCHING = 'barely touching (less than 0.1mm)'
const DECK_IN = 'the deck in'
const SLOT_5 = 'slot 5'
const THEN = 'Then press the'
const CHECK_AXES = 'check z-axis'
const TO_DETERMINE_MATCH =
  'button to determine how this position compares to the previously-saved z-axis calibration coordinate.'

const EXIT_CALIBRATION_CHECK = 'exit robot calibration check'

const BAD = 'Bad'
const DETECTED = 'detected'
const GOOD_INSPECTING_HEADER = 'Good calibration'
const BAD_INSPECTING_PREAMBLE =
  'Your current pipette tip position falls outside the acceptable tolerance range for a'
const GOOD_INSPECTING_PREAMBLE =
  'Your current pipette tip position falls within the acceptable tolerance range for a '
const INSPECTING_COMPARISON =
  "pipette when compared to your robot's saved Z-axis calibration coordinates."
const DECK_CAL_BLURB =
  'To resolve this issue, please exit robot calibration check and perform a deck calibration. View'
const TROUBLESHOOT_BLURB = 'To troubleshoot this issue, please consult'
const THIS_ARTICLE = 'this article'
const TO_LEARN = 'to learn more'
const FOLLOW_INSTRUCTIONS = 'and follow the instructions provided.'
const BAD_OUTCOME_URL =
  'http://support.opentrons.com/en/articles/4028788-checking-your-ot-2-s-calibration'
const CONTINUE_BLURB = 'You may also continue forward to the next check.'

function buildBadOutcomeHeader(transform: CHECK_TRANSFORM_TYPE): string {
  let outcome = ''
  switch (transform) {
    case CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET:
      outcome = 'pipette offset calibration data'
      break
    case CHECK_TRANSFORM_TYPE_DECK:
      outcome = 'deck calibration data'
      break
    case CHECK_TRANSFORM_TYPE_UNKNOWN:
      outcome = 'deck calibration data or pipette offset calibration data'
      break
  }
  return `${BAD} ${outcome} ${DETECTED}`
}

function BadOutcomeBody(props: {|
  transform: CHECK_TRANSFORM_TYPE,
|}): React.Node {
  const { transform } = props
  switch (transform) {
    case CHECK_TRANSFORM_TYPE_DECK: {
      return (
        <>
          <p className={styles.difference_body}>
            {DECK_CAL_BLURB}
            &nbsp;
            <Link href={BAD_OUTCOME_URL} external>
              {THIS_ARTICLE}
            </Link>
            &nbsp;
            {TO_LEARN}
          </p>
          <p className={styles.difference_body}>{CONTINUE_BLURB}</p>
        </>
      )
    }
    case CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET:
    case CHECK_TRANSFORM_TYPE_UNKNOWN: {
      return (
        <p className={styles.difference_body}>
          {TROUBLESHOOT_BLURB}
          &nbsp;
          <Link href={BAD_OUTCOME_URL} external>
            {THIS_ARTICLE}
          </Link>
          &nbsp;
          {FOLLOW_INSTRUCTIONS}
        </p>
      )
    }
    default:
      return null
  }
}

type CheckHeightProps = {|
  isMulti: boolean,
  mount: Mount | null,
  isInspecting: boolean,
  comparison: RobotCalibrationCheckComparison,
  pipetteModel: string,
  exit: () => mixed,
  nextButtonText: string,
  comparePoint: () => void,
  goToNextCheck: () => void,
  jog: (JogAxis, JogDirection, JogStep) => void,
|}
export function CheckHeight(props: CheckHeightProps): React.Node {
  const {
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
    () => mount && assetMap[mount][isMulti ? 'multi' : 'single'],
    [mount, isMulti]
  )

  return (
    <>
      <div className={styles.modal_header}>
        <h3>{CHECK_Z_HEADER}</h3>
      </div>
      {isInspecting ? (
        <CompareZ
          comparison={comparison}
          goToNextCheck={goToNextCheck}
          pipetteModel={pipetteModel}
          exit={exit}
          nextButtonText={nextButtonText}
        />
      ) : (
        <>
          <div className={styles.step_check_wrapper}>
            <div className={styles.step_check_body_wrapper}>
              <p className={styles.tip_pick_up_demo_body}>
                {JOG_UNTIL}
                <b>&nbsp;{JUST_BARELY_TOUCHING}&nbsp;</b>
                {DECK_IN}
                <b>&nbsp;{SLOT_5}.&nbsp;</b>
                <br />
                <br />
                {THEN}
                <b>&nbsp;{CHECK_AXES}&nbsp;</b>
                {TO_DETERMINE_MATCH}
              </p>
            </div>
            <div className={styles.step_check_video_wrapper}>
              <video
                key={demoAsset}
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
            <JogControls jog={jog} stepSizes={[0.1, 1]} axes={['z']} />
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

type CompareZProps = {|
  comparison: RobotCalibrationCheckComparison,
  goToNextCheck: () => void,
  pipetteModel: string,
  exit: () => mixed,
  nextButtonText: string,
|}
function CompareZ(props: CompareZProps) {
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
    header = buildBadOutcomeHeader(transformType)
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
        <BadOutcomeBody transform={comparison.transformType} />
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
