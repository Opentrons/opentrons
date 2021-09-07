import * as React from 'react'
import { useSelector } from 'react-redux'
import {
  Flex,
  Box,
  Icon,
  Text,
  SecondaryBtn,
  Tooltip,
  useHoverTooltip,
  COLOR_ERROR,
  SIZE_2,
  SIZE_3,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_START,
  JUSTIFY_CENTER,
  FONT_SIZE_BODY_1,
  FONT_SIZE_CAPTION,
  FONT_WEIGHT_SEMIBOLD,
  FONT_STYLE_ITALIC,
  TEXT_TRANSFORM_CAPITALIZE,
  OVERLAY_LIGHT_GRAY_50,
} from '@opentrons/components'

import * as Config from '../../../redux/config'
import * as CustomLabware from '../../../redux/custom-labware'
import {
  getCalibrationForPipette,
  getTipLengthForPipetteAndTiprack,
} from '../../../redux/calibration'
import { useCalibratePipetteOffset } from '../../../organisms/CalibratePipetteOffset/useCalibratePipetteOffset'
import { InlineCalibrationWarning } from '../../../molecules/InlineCalibrationWarning'
import { AskForCalibrationBlockModal } from '../../../organisms/CalibrateTipLength/AskForCalibrationBlockModal'
import {
  INTENT_RECALIBRATE_PIPETTE_OFFSET,
  INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
} from '../../../organisms/CalibrationPanels'
import { formatLastModified } from '../../../organisms/CalibrationPanels/utils'
import { Portal } from '../../../App/portal'
import { getDisplayNameForTipRack } from './utils'

import type { Mount } from '../../../redux/pipettes/types'
import type { State } from '../../../redux/types'

// TODO: BC(2021-02-16): i18n

const NO_PIPETTE_ATTACHED = 'No pipette attached'
const PIPETTE_OFFSET_MISSING = 'Pipette offset calibration missing.'
const CALIBRATE_NOW = 'Please calibrate offset now.'
const CALIBRATE_OFFSET = 'Calibrate pipette offset'
const RECALIBRATE_OFFSET = 'Recalibrate pipette offset'
const RECALIBRATE_TIP = 'recalibrate tip length'
const PIPETTE_OFFSET_CALIBRATION = 'pipette offset calibration'
const TIP_LENGTH_CALIBRATION = 'tip length calibration'
const TIP_NOT_CALIBRATED_BODY =
  "You will calibrate this tip length when you calibrate this pipette's offset."
const LAST_CALIBRATED = 'Last calibrated'
const TLC_INVALIDATES_POC_WARNING =
  'If you recalibrate this tip length, you will need to recalibrate your pipette offset afterwards'

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

interface Props {
  robotName: string
  serialNumber: string | null
  mount: Mount
  disabledReason: string | null
  isChangingOrConfiguringPipette: boolean
}

export function PipetteCalibrationInfo(props: Props): JSX.Element {
  const {
    robotName,
    serialNumber,
    mount,
    disabledReason,
    isChangingOrConfiguringPipette,
  } = props
  const [tlcTargetProps, tlcTooltipProps] = useHoverTooltip()
  const [pocTargetProps, pocTooltipProps] = useHoverTooltip()
  const pipetteOffsetCalibration = useSelector((state: State) =>
    serialNumber
      ? getCalibrationForPipette(state, robotName, serialNumber, mount)
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

  interface StartWizardOptions {
    keepTipLength: boolean
    hasBlockModalResponse?: boolean | null
  }
  const startPipetteOffsetPossibleTLC = (options: StartWizardOptions): void => {
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
          ? INTENT_RECALIBRATE_PIPETTE_OFFSET
          : INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
      })
      setCalBlockModalState(CAL_BLOCK_MODAL_CLOSED)
    }
  }

  if (!serialNumber) {
    return (
      <Flex
        backgroundColor={OVERLAY_LIGHT_GRAY_50}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        flex="1 1 auto"
        fontStyle={FONT_STYLE_ITALIC}
        fontSize={FONT_SIZE_CAPTION}
        minHeight={SIZE_3}
      >
        {NO_PIPETTE_ATTACHED}
      </Flex>
    )
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      backgroundColor={OVERLAY_LIGHT_GRAY_50}
      padding={SPACING_3}
      flex="1 1 auto"
    >
      <Text
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        fontSize={FONT_SIZE_BODY_1}
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        marginBottom={SPACING_2}
      >
        {PIPETTE_OFFSET_CALIBRATION}
      </Text>
      {pipetteOffsetCalibration ? (
        <>
          {pipetteOffsetCalibration.status.markedBad && (
            <InlineCalibrationWarning
              warningType="recommended"
              marginTop={0}
              marginBottom={SPACING_2}
            />
          )}
          <Text
            fontStyle={FONT_STYLE_ITALIC}
            fontSize={FONT_SIZE_CAPTION}
            marginBottom={SPACING_2}
          >
            {`${LAST_CALIBRATED}: ${formatLastModified(
              pipetteOffsetCalibration.lastModified
            )}`}
          </Text>
        </>
      ) : (
        <Flex
          marginBottom={SPACING_2}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_START}
        >
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
      )}
      <SecondaryBtn
        {...pocTargetProps}
        title="pipetteOffsetCalButton"
        onClick={
          pipetteOffsetCalibration
            ? () =>
                startPipetteOffsetCalibration({
                  withIntent: INTENT_RECALIBRATE_PIPETTE_OFFSET,
                })
            : () => startPipetteOffsetPossibleTLC({ keepTipLength: true })
        }
        // @ts-expect-error TODO: SecondaryBtn expects disabled to be explicit boolean type, cast here?
        disabled={disabledReason}
        width="15rem"
        paddingX={SPACING_2}
        marginBottom={SPACING_1}
      >
        {pipetteOffsetCalibration ? RECALIBRATE_OFFSET : CALIBRATE_OFFSET}
      </SecondaryBtn>

      <Text
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        fontSize={FONT_SIZE_BODY_1}
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        margin={`${SPACING_3} 0 ${SPACING_2}`}
      >
        {TIP_LENGTH_CALIBRATION}
      </Text>
      {pipetteOffsetCalibration && (
        <Text marginBottom={SPACING_2} fontSize={FONT_SIZE_BODY_1}>
          {getDisplayNameForTipRack(
            pipetteOffsetCalibration.tiprackUri,
            customLabwareDefs
          )}
        </Text>
      )}
      {pipetteOffsetCalibration && tipLengthCalibration ? (
        <>
          <Text
            marginBottom={SPACING_2}
            fontStyle={FONT_STYLE_ITALIC}
            fontSize={FONT_SIZE_CAPTION}
          >
            {`${LAST_CALIBRATED}: ${formatLastModified(
              tipLengthCalibration.lastModified
            )}`}
          </Text>
          {tipLengthCalibration.status.markedBad && (
            <InlineCalibrationWarning warningType="recommended" />
          )}
          <SecondaryBtn
            {...tlcTargetProps}
            title="recalibrateTipButton"
            onClick={() =>
              startPipetteOffsetPossibleTLC({ keepTipLength: false })
            }
            // @ts-expect-error TODO: SecondaryBtn expects disabled to be explicit boolean type, cast here?
            disabled={disabledReason}
            width="15rem"
            paddingX={SPACING_2}
          >
            {RECALIBRATE_TIP}
          </SecondaryBtn>
          <Text
            marginTop={SPACING_3}
            fontStyle={FONT_STYLE_ITALIC}
            fontSize={FONT_SIZE_CAPTION}
          >
            {TLC_INVALIDATES_POC_WARNING}
          </Text>
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
      {!isChangingOrConfiguringPipette && PipetteOffsetCalibrationWizard}
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
      {disabledReason !== null && (
        <>
          <Tooltip {...pocTooltipProps}>{disabledReason}</Tooltip>
          <Tooltip {...tlcTooltipProps}>{disabledReason}</Tooltip>
        </>
      )}
    </Flex>
  )
}
