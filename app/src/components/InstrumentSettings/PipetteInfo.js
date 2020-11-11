// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import {
  LabeledValue,
  InstrumentDiagram,
  Box,
  Flex,
  Text,
  PrimaryBtn,
  SecondaryBtn,
  useHoverTooltip,
  Tooltip,
  DIRECTION_COLUMN,
  FONT_WEIGHT_SEMIBOLD,
  FONT_WEIGHT_BOLD,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  SIZE_1,
  SIZE_2,
  SIZE_4,
  SIZE_6,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_FLEX_START,
  ALIGN_CENTER,
  BORDER_SOLID_LIGHT,
  Icon,
  COLOR_ERROR,
  FONT_SIZE_BODY_1,
  FONT_STYLE_ITALIC,
  JUSTIFY_START,
  TEXT_TRANSFORM_UPPERCASE,
  FONT_SIZE_BODY_2,
} from '@opentrons/components'
import styles from './styles.css'
import { getRobotByName } from '../../discovery'
import { getIsRunning } from '../../robot/selectors'
import {
  DISABLED_CONNECT_TO_ROBOT,
  DISABLED_PROTOCOL_IS_RUNNING,
} from '../RobotSettings/constants'
import { PipetteCalibrationInfo } from './PipetteCalibrationInfo'

import type { State } from '../../types'
import type { Mount, AttachedPipette } from '../../pipettes/types'

export type PipetteInfoProps = {|
  robotName: string,
  mount: Mount,
  pipette: AttachedPipette | null,
  changeUrl: string,
  settingsUrl: string | null,
|}

const MOUNT = 'mount'
const NOWN_CUSTOM_LABWARE = 'unknown custom tiprack'
const SERIAL_NUMBER = 'Serial number'

export function PipetteInfo(props: PipetteInfoProps): React.Node {
  const { robotName, mount, pipette, changeUrl, settingsUrl } = props
  const displayName = pipette ? pipette.modelSpecs.displayName : null
  const serialNumber = pipette ? pipette.id : null
  const channels = pipette ? pipette.modelSpecs.channels : null
  const direction = pipette ? 'change' : 'attach'

  const isRunning = useSelector(getIsRunning)
  const isConnected = useSelector(
    (state: State) => getRobotByName(state, robotName)?.connected
  )

  const [settingsTargetProps, settingsTooltipProps] = useHoverTooltip()
  const [changePipTargetProps, changePipTooltipProps] = useHoverTooltip()

  let disabledReason = null
  if (!isConnected) {
    disabledReason = DISABLED_CONNECT_TO_ROBOT
  } else if (isRunning) {
    disabledReason = DISABLED_PROTOCOL_IS_RUNNING
  }

  return (
    <Flex width="48%" flexDirection={DIRECTION_COLUMN}>
      <Text
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        fontSize={FONT_SIZE_BODY_1}
        fontWeight={FONT_WEIGHT_BOLD}
        marginBottom={SPACING_2}
      >
        {`${mount} ${MOUNT}`}
      </Text>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Box
          key={`pipetteImage${mount}`}
          height={SIZE_4}
          minWidth="2.25rem"
          border={BORDER_SOLID_LIGHT}
          marginX={SPACING_3}
        >
          {channels && (
            <InstrumentDiagram
              pipetteSpecs={pipette?.modelSpecs}
              mount={mount}
              className={styles.pipette_diagram}
            />
          )}
        </Box>
        <Text
          wordSpacing={SIZE_6} // always one word to a line
          fontSize={FONT_SIZE_BODY_1}
          fontWeight={FONT_WEIGHT_SEMIBOLD}
        >
          {/* NOTE: non breaking hyphen */}
          {(displayName || 'None').replace(/-/, '‑')}
        </Text>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <PrimaryBtn
            {...(disabledReason ? changePipTargetProps : {})}
            as={disabledReason ? 'button' : Link}
            to={changeUrl}
            disabled={disabledReason}
            title="changePipetteButton"
            width={SIZE_4}
            marginBottom={SPACING_2}
          >
            {direction}
          </PrimaryBtn>
          {settingsUrl !== null && (
            <SecondaryBtn
              {...(disabledReason ? settingsTargetProps : {})}
              as={disabledReason ? 'button' : Link}
              to={settingsUrl}
              disabled={disabledReason}
              title="pipetteSettingsButton"
              width={SIZE_4}
            >
              settings
            </SecondaryBtn>
          )}
        </Flex>
      </Flex>
      <Flex
        fontSize={FONT_SIZE_BODY_1}
        margin={`${SPACING_2} ${SPACING_2} ${SPACING_3}`}
      >
        <Text marginRight={SPACING_1} fontWeight={FONT_WEIGHT_SEMIBOLD}>
          {SERIAL_NUMBER}:
        </Text>
        <Text>{serialNumber || 'None'}</Text>
      </Flex>
      {serialNumber && (
        <PipetteCalibrationInfo
          robotName={robotName}
          serialNumber={serialNumber}
          mount={mount}
          disabledReason={disabledReason}
        />
      )}
      {disabledReason !== null && (
        <>
          <Tooltip {...settingsTooltipProps}>{disabledReason}</Tooltip>
          <Tooltip {...changePipTooltipProps}>{disabledReason}</Tooltip>
        </>
      )}
    </Flex>
  )
}
