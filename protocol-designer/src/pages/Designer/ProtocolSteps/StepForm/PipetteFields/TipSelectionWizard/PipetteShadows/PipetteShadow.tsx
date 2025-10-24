import { COLORS } from '@opentrons/components'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { getHoveredOffsetFromWell } from '../utils'
import { EightChannelFlexShadow } from './EightChannelFlexShadow'
import { EightChannelOT2Shadow } from './EightChannelOT2Shadow'
import { NinetySixChannelFlexShadow } from './NinetySixChannelFlexShadow'
import { SingleChannelOT2Shadow } from './SingleChannelOT2Shadow'
import { SingleChannelFlexShadow } from './SingleChannelShadow'

import type { Channels } from '@opentrons/components'
import type {
  CoordinateTuple,
  PipetteV2Specs,
  RobotType,
} from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'
import type { PipetteShadowProps } from '../types'

const SHADOW_BY_ROBOT_TYPE_AND_CHANNELS: Record<
  RobotType,
  Record<Channels, (props: PipetteShadowProps) => JSX.Element>
> = {
  [OT2_ROBOT_TYPE]: {
    1: SingleChannelOT2Shadow,
    8: EightChannelOT2Shadow,
    96: () => {
      console.warn('96-channel not supported on OT-2')
      return <></>
    },
  },
  [FLEX_ROBOT_TYPE]: {
    1: SingleChannelFlexShadow,
    8: EightChannelFlexShadow,
    96: NinetySixChannelFlexShadow,
  },
}

// TODO: adjust once partial tip selection is enabled
export function PipetteShadow(props: {
  pipetteSpec: PipetteV2Specs
  slotPosition: CoordinateTuple
  hoveredWell: string
  selectedTiprackId: string
  labwareState: AllTemporalPropertiesForTimelineFrame['labware']
  isAccessible: boolean
  primaryNozzle: string
  robotType: RobotType
}): JSX.Element {
  const {
    pipetteSpec,
    slotPosition,
    hoveredWell,
    selectedTiprackId,
    labwareState,
    isAccessible,
    primaryNozzle,
    robotType,
  } = props
  const [slotX, slotY] = slotPosition

  const { x: xOffset, y: yOffset } = getHoveredOffsetFromWell({
    selectedTiprackId,
    labwareState,
    wellName: hoveredWell,
    pipetteSpec,
    primaryNozzle,
  })

  const { channels, pipetteBoundingBoxOffsets } = pipetteSpec
  const { backLeftCorner, frontRightCorner } = pipetteBoundingBoxOffsets
  const width = frontRightCorner[0] - backLeftCorner[0]
  const height = backLeftCorner[1] - frontRightCorner[1]
  const shadowProps = {
    x: slotX + xOffset,
    y: slotY + yOffset,
    width,
    height,
    stroke: isAccessible ? COLORS.blue50 : COLORS.red50,
    fill: isAccessible
      ? `${COLORS.black90}${COLORS.opacity20HexCode}`
      : `${COLORS.red50}${COLORS.opacity20HexCode}`,
  }

  const ShadowComponent = SHADOW_BY_ROBOT_TYPE_AND_CHANNELS[robotType][channels]
  return <ShadowComponent {...shadowProps} />
}
