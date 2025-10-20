import { COLORS } from '@opentrons/components'

import { getHoveredOffsetFromWell } from '../utils'
import { EightChannelFlexShadow } from './EightChannelFlexShadow'
import { NinetySixFlexShadow } from './NinetySixFlexShadow'
import { SingleChannelFlexShadow } from './SingleChannelShadow'

import type { CoordinateTuple, PipetteV2Specs } from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'

// TODO: adjust once partial tip selection is enabled
export function PipetteShadow(props: {
  pipetteSpec: PipetteV2Specs
  slotPosition: CoordinateTuple
  hoveredWell: string
  selectedTiprackId: string
  labwareState: AllTemporalPropertiesForTimelineFrame['labware']
  isAccessible: boolean
  primaryNozzle: string
}): JSX.Element {
  const {
    pipetteSpec,
    slotPosition,
    hoveredWell,
    selectedTiprackId,
    labwareState,
    isAccessible,
    primaryNozzle,
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
  if (channels === 1) {
    return <SingleChannelFlexShadow {...shadowProps} />
  } else if (channels === 8) {
    return <EightChannelFlexShadow {...shadowProps} />
  }
  return <NinetySixFlexShadow {...shadowProps} />
}
