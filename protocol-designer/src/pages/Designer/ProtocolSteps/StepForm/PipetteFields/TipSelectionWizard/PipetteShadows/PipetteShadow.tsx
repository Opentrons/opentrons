import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { COLORS } from '@opentrons/components'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import styles from '../tipselectionwizard.module.css'
import {
  getHoveredOffsetFromWell,
  getLabelOffsetByPlacement,
  getPlacementByViewboxAndPipetteSpec,
} from '../utils'
import { EightChannelFlexShadow } from './EightChannelFlexShadow'
import { EightChannelOT2Shadow } from './EightChannelOT2Shadow'
import { NinetySixChannelFlexShadow } from './NinetySixChannelFlexShadow'
import { PipetteLabel } from './PipetteLabel'
import { SingleChannelOT2Shadow } from './SingleChannelOT2Shadow'
import { SingleChannelFlexShadow } from './SingleChannelShadow'

import type { Channels } from '@opentrons/components'
import type {
  CoordinateTuple,
  PipetteV2Specs,
  RobotType,
} from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'
import type { InaccessibleReason, PipetteShadowProps } from '../types'

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
  inaccessibleReason: InaccessibleReason | null
  primaryNozzle: string
  robotType: RobotType
  enclosingViewbox: string | null
}): JSX.Element {
  const {
    pipetteSpec,
    slotPosition,
    hoveredWell,
    selectedTiprackId,
    labwareState,
    isAccessible,
    inaccessibleReason,
    primaryNozzle,
    robotType,
    enclosingViewbox,
  } = props
  const [slotX, slotY] = slotPosition
  const { t } = useTranslation('tip_selection')
  const labelRef = useRef<HTMLDivElement>(null)
  const [labelWidth, setLabelWidth] = useState(0)
  const [labelHeight, setLabelHeight] = useState(0)
  useEffect(() => {
    if (labelRef.current) {
      setLabelWidth(labelRef.current.offsetWidth)
      setLabelHeight(labelRef.current.offsetHeight)
    }
  }, [hoveredWell])

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

  const labelPlacement = getPlacementByViewboxAndPipetteSpec({
    enclosingViewbox,
    x: slotX + xOffset,
    y: slotY + yOffset,
    width,
    height,
    channels,
  })
  const ShadowComponent = SHADOW_BY_ROBOT_TYPE_AND_CHANNELS[robotType][channels]
  const { x: labelOffsetX, y: labelOffsetY } = getLabelOffsetByPlacement({
    labelPlacement,
    labelWidth,
    labelHeight,
    shadowWidth: width,
    shadowHeight: height,
  })
  const labelText =
    !isAccessible && inaccessibleReason != null
      ? t(`tip_inaccessible.${inaccessibleReason}`)
      : t('select_tip')
  return (
    <g className={styles.shadow_overlay}>
      <PipetteLabel
        ref={labelRef}
        text={labelText}
        isZoomed
        x={slotX + xOffset + labelOffsetX}
        y={slotY + yOffset + labelOffsetY}
        placement={labelPlacement}
        isError={!isAccessible}
      />
      <ShadowComponent {...shadowProps} />
    </g>
  )
}
