// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'
import { Link } from 'react-router-dom'

import { getLabwareDisplayName } from '@opentrons/shared-data'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

import {
  LabeledValue,
  OutlineButton,
  InstrumentDiagram,
  Box,
  Flex,
  Text,
  SecondaryBtn,
  DIRECTION_COLUMN,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  SIZE_2,
  SIZE_4,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_FLEX_START,
  ALIGN_CENTER,
  BORDER_SOLID_LIGHT,
  Icon,
  COLOR_ERROR,
  FONT_SIZE_BODY_1,
  FONT_STYLE_ITALIC,
  JUSTIFY_START,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import * as Config from '../../config'
import styles from './styles.css'
import { useCalibratePipetteOffset } from '../CalibratePipetteOffset/useCalibratePipetteOffset'
import { AskForCalibrationBlockModal } from '../CalibrateTipLength/AskForCalibrationBlockModal'
import {
  INTENT_PIPETTE_OFFSET,
  INTENT_TIP_LENGTH_OUTSIDE_PROTOCOL,
} from '../CalibrationPanels'
import type { State } from '../../types'

import {
  getCalibrationForPipette,
  getTipLengthForPipetteAndTiprack,
} from '../../calibration'

import { InlineCalibrationWarning } from '../InlineCalibrationWarning'

import type { Mount, AttachedPipette } from '../../pipettes/types'
import { findLabwareDefWithCustom } from '../../findLabware'
import * as CustomLabware from '../../custom-labware'
import { Portal } from '../portal'

export type PipetteInfoProps = {|
  robotName: string,
  mount: Mount,
  pipette: AttachedPipette | null,
  changeUrl: string,
  settingsUrl: string | null,
|}

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

const LABEL_BY_MOUNT = {
  left: 'Left pipette',
  right: 'Right pipette',
}

const PIPETTE_OFFSET_CALIBRATION = 'pipette offset calibration'
const UNKNOWN_CUSTOM_LABWARE = 'unknown custom tiprack'
const SERIAL_NUMBER = 'Serial number'
const PIPETTE_OFFSET_MISSING = 'Pipette offset calibration missing.'
const CALIBRATE_NOW = 'Please calibrate offset now.'
const CALIBRATE_OFFSET = 'Calibrate offset'
const DEFAULT_TIP = 'default tip'
const TIP_NOT_CALIBRATED_BODY =
  'Not calibrated yet. The tip you use to calibrate your pipette offset will become your default tip.'
const PER_PIPETTE_BTN_STYLE = {
  width: '11rem',
  marginTop: SPACING_2,
  padding: SPACING_2,
}
const RECALIBRATE_TIP = 'recalibrate tip'

function getDisplayNameForTiprack(
  tiprackUri: string,
  customLabware: Array<LabwareDefinition2>
): string {
  const [namespace, loadName] = tiprackUri ? tiprackUri.split('/') : ['', '']
  const definition = findLabwareDefWithCustom(
    namespace,
    loadName,
    null,
    customLabware
  )
  return definition
    ? getLabwareDisplayName(definition)
    : `${UNKNOWN_CUSTOM_LABWARE}`
}

export function PipetteInfo(props: PipetteInfoProps): React.Node {
  const { robotName, mount, pipette, changeUrl, settingsUrl } = props
  const label = LABEL_BY_MOUNT[mount]
  const displayName = pipette ? pipette.modelSpecs.displayName : null
  const serialNumber = pipette ? pipette.id : null
  const channels = pipette ? pipette.modelSpecs.channels : null
  const direction = pipette ? 'change' : 'attach'
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
  const startPipetteOffsetWizard = (options: StartWizardOptions) => {
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

  const customLabwareDefs = useSelector((state: State) => {
    return CustomLabware.getCustomLabwareDefinitions(state)
  })

  const startPipetteOffsetCalibrationDirectly = () => {
    startPipetteOffsetCalibration({ withIntent: INTENT_PIPETTE_OFFSET })
  }

  const pipImage = (
    <Box
      key={`pipetteImage${mount}`}
      height={SIZE_4}
      width="2.25rem"
      border={BORDER_SOLID_LIGHT}
      marginRight={mount === 'right' ? SPACING_3 : SPACING_1}
      marginLeft={mount === 'right' ? SPACING_1 : SPACING_3}
    >
      {channels && (
        <InstrumentDiagram
          pipetteSpecs={pipette?.modelSpecs}
          mount={mount}
          className={styles.pipette_diagram}
        />
      )}
    </Box>
  )

  const pipInfo = (
    <Flex key={`pipetteInfo${mount}`} flex="1" flexDirection={DIRECTION_COLUMN}>
      <Flex
        alignItems={ALIGN_FLEX_START}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        css={css`
          max-width: 14rem;
        `}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          height="10rem"
        >
          <LabeledValue
            label={label}
            value={(displayName || 'None').replace(/-/, '‑')} // non breaking hyphen
          />
          <LabeledValue label={SERIAL_NUMBER} value={serialNumber || 'None'} />
        </Flex>

        <OutlineButton Component={Link} to={changeUrl}>
          {direction}
        </OutlineButton>
      </Flex>
      {settingsUrl !== null && (
        <SecondaryBtn {...PER_PIPETTE_BTN_STYLE} as={Link} to={settingsUrl}>
          settings
        </SecondaryBtn>
      )}
      {serialNumber && (
        <>
          <SecondaryBtn
            {...PER_PIPETTE_BTN_STYLE}
            title="pipetteOffsetCalButton"
            onClick={
              pipetteOffsetCalibration
                ? startPipetteOffsetCalibrationDirectly
                : () => startPipetteOffsetWizard({ keepTipLength: true })
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
                <Box
                  size={SIZE_2}
                  paddingRight={SPACING_2}
                  paddingY={SPACING_1}
                >
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
              <InlineCalibrationWarning
                warningType="recommended"
                marginTop="0"
              />
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
                  {getDisplayNameForTiprack(
                    pipetteOffsetCalibration.tiprackUri,
                    customLabwareDefs
                  )}
                </Text>
                <SecondaryBtn
                  {...PER_PIPETTE_BTN_STYLE}
                  title="recalibrateTipButton"
                  onClick={() =>
                    startPipetteOffsetWizard({ keepTipLength: false })
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
        </>
      )}
    </Flex>
  )

  return (
    <>
      {PipetteOffsetCalibrationWizard}
      {calBlockModalState !== CAL_BLOCK_MODAL_CLOSED ? (
        <Portal level="top">
          <AskForCalibrationBlockModal
            onResponse={hasBlockModalResponse => {
              startPipetteOffsetWizard({
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
      <Flex width="50%" flexDirection={DIRECTION_COLUMN}>
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          {mount === 'right' ? [pipImage, pipInfo] : [pipInfo, pipImage]}
        </Flex>
      </Flex>
    </>
  )
}
