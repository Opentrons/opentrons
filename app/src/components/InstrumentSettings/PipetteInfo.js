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
} from '@opentrons/components'
import * as Config from '../../config'
import styles from './styles.css'
import { useCalibratePipetteOffset } from '../CalibratePipetteOffset/useCalibratePipetteOffset'
import { AskForCalibrationBlockModal } from '../CalibrateTipLength/AskForCalibrationBlockModal'
import type { State } from '../../types'

import {
  getCalibrationForPipette,
  getTipLengthForPipetteAndTiprack,
} from '../../calibration'

import { InlineCalibrationWarning } from '../InlineCalibrationWarning'

import type { Mount, AttachedPipette } from '../../pipettes/types'
import { findLabwareDefWithCustom } from '../../findLabware'
import * as CustomLabware from '../../custom-labware'

export type PipetteInfoProps = {|
  robotName: string,
  mount: Mount,
  pipette: AttachedPipette | null,
  changeUrl: string,
  settingsUrl: string | null,
|}

const LABEL_BY_MOUNT = {
  left: 'Left pipette',
  right: 'Right pipette',
}

const UNKNOWN_CUSTOM_LABWARE = 'unknown custom tiprack'
const SERIAL_NUMBER = 'Serial number'
const PIPETTE_OFFSET_MISSING = 'Pipette offset calibration missing.'
const CALIBRATE_NOW = 'Please calibrate offset now.'
const CALIBRATE_OFFSET = 'Calibrate offset'
const CALIBRATED_WITH = 'Calibrated with:'
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

  const calBlockPromptShouldRecalibrateTipLength = React.useRef<boolean | null>(
    null
  )

  const configHasCalibrationBlock = useSelector(Config.getHasCalibrationBlock)
  // null hides modal, true shows modal and continues with existing tlc data,
  // false shows modal and recalibrates tip length
  const [
    showCalBlockModalAndKeepTipLength,
    setShowCalBlockModalAndKeepTipLength,
  ] = React.useState<null | boolean>(null)

  type StartWizardOptions = {|
    keepTipLength: boolean,
    hasBlockModalResponse?: boolean | null,
  |}
  const startPipetteOffsetWizard = (options: StartWizardOptions) => {
    console.log('start wizard', pipetteOffsetCalibration)
    const { keepTipLength, hasBlockModalResponse = null } = options
    if (hasBlockModalResponse === null && configHasCalibrationBlock === null) {
      setShowCalBlockModalAndKeepTipLength(keepTipLength)
    } else {
      startPipetteOffsetCalibration({
        hasCalibrationBlock: Boolean(
          configHasCalibrationBlock ?? hasBlockModalResponse
        ),
        shouldRecalibrateTipLength: keepTipLength ? undefined : true,
      })
      setShowCalBlockModalAndKeepTipLength(null)
    }
  }

  const customLabwareDefs = useSelector((state: State) => {
    return CustomLabware.getCustomLabwareDefinitions(state)
  })

  const startPipetteOffsetCalibrationDirectly = () => {
    console.log('start direct')
    startPipetteOffsetCalibration({})
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
        </>
      )}
      {serialNumber && (
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
      )}

      {serialNumber && pipetteOffsetCalibration && tipLengthCalibration && (
        <>
          <Box>
            <Text
              marginTop={SPACING_2}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
              fontSize={FONT_SIZE_BODY_1}
            >
              {CALIBRATED_WITH}
            </Text>
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
          </Box>
          <SecondaryBtn
            {...PER_PIPETTE_BTN_STYLE}
            title="recalibrateTipButton"
            onClick={() => startPipetteOffsetWizard({ keepTipLength: false })}
          >
            {RECALIBRATE_TIP}
          </SecondaryBtn>
          {tipLengthCalibration.status.markedBad && (
            <InlineCalibrationWarning warningType="recommended" />
          )}
        </>
      )}
    </Flex>
  )

  return (
    <>
      {PipetteOffsetCalibrationWizard}
      {showCalBlockModalAndKeepTipLength !== null ? (
        <AskForCalibrationBlockModal
          onResponse={hasBlockModalResponse => {
            startPipetteOffsetWizard({
              hasBlockModalResponse,
              keepTipLength: showCalBlockModalAndKeepTipLength,
            })
          }}
        />
      ) : null}
      <Flex width="50%" flexDirection={DIRECTION_COLUMN}>
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          {mount === 'right' ? [pipImage, pipInfo] : [pipInfo, pipImage]}
        </Flex>
      </Flex>
    </>
  )
}
