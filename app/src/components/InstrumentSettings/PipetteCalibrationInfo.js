// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import {
  Flex,
  Box,
  Icon,
  Text,
  SecondaryBtn,
  COLOR_ERROR,
  SIZE_2,
  SPACING_1,
  SPACING_2,
  ALIGN_FLEX_START,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_START,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
  FONT_STYLE_ITALIC,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'

import * as Config from '../../config'
import * as CustomLabware from '../../custom-labware'
import {
  getCalibrationForPipette,
  getTipLengthForPipetteAndTiprack,
} from '../../calibration'
import { useCalibratePipetteOffset } from '../CalibratePipetteOffset/useCalibratePipetteOffset'
import { InlineCalibrationWarning } from '../InlineCalibrationWarning'
import { AskForCalibrationBlockModal } from '../CalibrateTipLength/AskForCalibrationBlockModal'
import {
  INTENT_PIPETTE_OFFSET,
  INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
} from '../CalibrationPanels'
import { Portal } from '../portal'
import { getDisplayNameForTipRack } from './utils'

import type { Mount } from '../../pipettes/types'
import type { State } from '../../types'

const PIPETTE_OFFSET_MISSING = 'Pipette offset calibration missing.'
const CALIBRATE_OFFSET = 'Calibrate offset'
const CALIBRATE_NOW = 'Please calibrate offset now.'
const DEFAULT_TIP = 'default tip'
const RECALIBRATE_TIP = 'recalibrate tip'
const PIPETTE_OFFSET_CALIBRATION = 'pipette offset calibration'
const TIP_NOT_CALIBRATED_BODY =
  'Not calibrated yet. The tip you use to calibrate your pipette offset will become your default tip.'

const PER_PIPETTE_BTN_STYLE = {
  width: '11rem',
  marginTop: SPACING_2,
  padding: SPACING_2,
}

const CAL_BLOCK_MODAL_CLOSED: 'cal_block_modal_closed' =
  'cal_block_modal_closed'
const CAL_BLOCK_MODAL_OPEN_WITH_REDO_TLC: 'cal_block_modal_redo' =
  'cal_block_modal_redo'
const CAL_BLOCK_MODAL_OPEN_WITH_KEEP_TLC: 'cal_block_modal_keep' =
  'cal_block_modal_keep'

type CalBlockModalState =
  | typeof CAL_BLOCK_MODAL_CLOSED
  | typeof CAL_BLOCK_MODAL_OPEN_WITH_REDO_TLC
  | typeof CAL_BLOCK_MODAL_OPEN_WITH_KEEP_TLC

type Props = {|
  robotName: string,
  serialNumber: string | null,
  mount: Mount,
|}

export function PipetteCalibrationInfo(props: Props): React.Node {
  const { robotName, serialNumber, mount } = props
  const pipetteOffsetCalibration = useSelector((state: State) =>
    serialNumber
      ? getCalibrationForPipette(state, robotName, serialNumber)
      : null
  )
  const tipLengthCalibration = useSelector((state: State) =>
    serialNumber && pipetteOffsetCalibration
      ? getTipLengthForPipetteAndTiprack(
          state,
          robotName,
          serialNumber,
          pipetteOffsetCalibration?.tiprack
        )
      : null
  )

  const customLabwareDefs = useSelector((state: State) => {
    return CustomLabware.getCustomLabwareDefinitions(state)
  })

  const [
    startPipetteOffsetCalibration,
    PipetteOffsetCalibrationWizard,
  ] = useCalibratePipetteOffset(robotName, { mount })

  const configHasCalibrationBlock = useSelector(Config.getHasCalibrationBlock)
  const [
    calBlockModalState,
    setCalBlockModalState,
  ] = React.useState<CalBlockModalState>(CAL_BLOCK_MODAL_CLOSED)

  type StartWizardOptions = {|
    keepTipLength: boolean,
    hasBlockModalResponse?: boolean | null,
  |}
  const startPipetteOffsetPossibleTLC = (options: StartWizardOptions) => {
    const { keepTipLength, hasBlockModalResponse = null } = options
    if (hasBlockModalResponse === null && configHasCalibrationBlock === null) {
      setCalBlockModalState(
        keepTipLength
          ? CAL_BLOCK_MODAL_OPEN_WITH_KEEP_TLC
          : CAL_BLOCK_MODAL_OPEN_WITH_REDO_TLC
      )
    } else {
      startPipetteOffsetCalibration({
        overrideParams: {
          hasCalibrationBlock: Boolean(
            configHasCalibrationBlock ?? hasBlockModalResponse
          ),
          shouldRecalibrateTipLength: !keepTipLength,
        },
        withIntent: keepTipLength
          ? INTENT_PIPETTE_OFFSET
          : INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
      })
      setCalBlockModalState(CAL_BLOCK_MODAL_CLOSED)
    }
  }

  return (
    <Flex>
      <SecondaryBtn
        {...PER_PIPETTE_BTN_STYLE}
        title="pipetteOffsetCalButton"
        onClick={
          pipetteOffsetCalibration
            ? () =>
                startPipetteOffsetCalibration({
                  withIntent: INTENT_PIPETTE_OFFSET,
                })
            : () => startPipetteOffsetPossibleTLC({ keepTipLength: true })
        }
      >
        {CALIBRATE_OFFSET}
      </SecondaryBtn>
      <Flex
        marginTop={SPACING_2}
        alignItems={ALIGN_FLEX_START}
        justifyContent={JUSTIFY_START}
      >
        {!pipetteOffsetCalibration ? (
          <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_START}>
            <Box size={SIZE_2} paddingRight={SPACING_2} paddingY={SPACING_1}>
              <Icon name="alert-circle" color={COLOR_ERROR} />
            </Box>
            <Flex
              marginLeft={SPACING_1}
              flexDirection={DIRECTION_COLUMN}
              justifyContent={JUSTIFY_START}
            >
              <Text fontSize={FONT_SIZE_BODY_1} color={COLOR_ERROR}>
                {PIPETTE_OFFSET_MISSING}
              </Text>
              <Text fontSize={FONT_SIZE_BODY_1} color={COLOR_ERROR}>
                {CALIBRATE_NOW}
              </Text>
            </Flex>
          </Flex>
        ) : pipetteOffsetCalibration.status.markedBad ? (
          <InlineCalibrationWarning warningType="recommended" marginTop="0" />
        ) : (
          <Box size={SIZE_2} padding="0" />
        )}
      </Flex>
      <Box>
        <Text
          marginTop={SPACING_2}
          fontWeight={FONT_WEIGHT_SEMIBOLD}
          fontSize={FONT_SIZE_BODY_1}
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
        >
          {DEFAULT_TIP}
        </Text>
        {pipetteOffsetCalibration && tipLengthCalibration ? (
          <>
            <Text
              marginTop={SPACING_2}
              fontStyle={FONT_STYLE_ITALIC}
              fontSize={FONT_SIZE_BODY_1}
            >
              {getDisplayNameForTipRack(
                pipetteOffsetCalibration.tiprackUri,
                customLabwareDefs
              )}
            </Text>
            <SecondaryBtn
              {...PER_PIPETTE_BTN_STYLE}
              title="recalibrateTipButton"
              onClick={() =>
                startPipetteOffsetPossibleTLC({ keepTipLength: false })
              }
            >
              {RECALIBRATE_TIP}
            </SecondaryBtn>
            {tipLengthCalibration.status.markedBad && (
              <InlineCalibrationWarning warningType="recommended" />
            )}
          </>
        ) : (
          <Text
            marginTop={SPACING_2}
            fontStyle={FONT_STYLE_ITALIC}
            fontSize={FONT_SIZE_BODY_1}
          >
            {TIP_NOT_CALIBRATED_BODY}
          </Text>
        )}
      </Box>
      {PipetteOffsetCalibrationWizard}
      {calBlockModalState !== CAL_BLOCK_MODAL_CLOSED ? (
        <Portal level="top">
          <AskForCalibrationBlockModal
            onResponse={hasBlockModalResponse => {
              startPipetteOffsetPossibleTLC({
                hasBlockModalResponse,
                keepTipLength:
                  calBlockModalState === CAL_BLOCK_MODAL_OPEN_WITH_KEEP_TLC,
              })
            }}
            titleBarTitle={PIPETTE_OFFSET_CALIBRATION}
            closePrompt={() => setCalBlockModalState(CAL_BLOCK_MODAL_CLOSED)}
          />
        </Portal>
      ) : null}
    </Flex>
  )
}
