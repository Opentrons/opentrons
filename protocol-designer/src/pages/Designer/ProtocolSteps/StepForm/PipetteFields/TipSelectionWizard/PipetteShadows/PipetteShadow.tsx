import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { COLORS } from '@opentrons/components'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE, SINGLE } from '@opentrons/shared-data'

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

import type { ReactNode } from 'react'

import type { Channels } from '@opentrons/components'
import type {
  CoordinateTuple,
  NozzleConfigurationStyle,
  PipetteV2Specs,
  PrimaryNozzleConfigurationStyle,
  RobotType,
} from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'
import type { InaccessibleReason, PipetteShadowProps } from '../types'

const SHADOW_BY_ROBOT_TYPE_AND_CHANNELS: Record<
  RobotType,
  Record<Channels, (props: PipetteShadowProps) => ReactNode>
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

export function PipetteShadow(props: {
  pipetteSpec: PipetteV2Specs
  slotPosition?: CoordinateTuple
  hoveredWell: string
  selectedLabwareId: string
  labwareState: AllTemporalPropertiesForTimelineFrame['labware']
  isAccessible: boolean
  inaccessibleReason: InaccessibleReason | null
  isHoveredWellSelected: boolean
  hasPickupsRemaining: boolean | null
  primaryNozzle: PrimaryNozzleConfigurationStyle
  robotType: RobotType
  enclosingViewbox: string | null
  nozzles: NozzleConfigurationStyle
  rotate?: boolean
}): ReactNode {
  const {
    pipetteSpec,
    slotPosition,
    hoveredWell,
    selectedLabwareId,
    labwareState,
    isAccessible,
    inaccessibleReason,
    isHoveredWellSelected,
    hasPickupsRemaining,
    primaryNozzle,
    robotType,
    enclosingViewbox,
    nozzles,
    rotate,
  } = props
  const [slotX, slotY] = slotPosition ?? [0, 0]
  const isTiprack = labwareState[selectedLabwareId].def.parameters.isTiprack
  const translationFile = isTiprack ? 'tip_selection' : 'well_selection'
  const { t } = useTranslation(translationFile)
  const labelRef = useRef<HTMLDivElement>(null)
  const [labelWidth, setLabelWidth] = useState(0)
  const [labelHeight, setLabelHeight] = useState(0)

  const isSingleTipPickup = nozzles === SINGLE

  const labelText = (() => {
    if (!hasPickupsRemaining && !isHoveredWellSelected && isTiprack) {
      return t('all_pickups_selected')
    }
    if (!isAccessible && inaccessibleReason != null) {
      return t(`inaccessible.${inaccessibleReason}`)
    }
    const pluralKey = isSingleTipPickup ? 'one' : 'multiple'
    if (isAccessible) {
      return isHoveredWellSelected
        ? t(`accessible.deselect_${pluralKey}`)
        : t(`accessible.select_${pluralKey}`)
    }
    console.error('No label text found')
    return ''
  })()

  useEffect(() => {
    if (labelRef.current) {
      setLabelWidth(labelRef.current.offsetWidth)
      setLabelHeight(labelRef.current.offsetHeight)
    }
  }, [hoveredWell, labelText])
  const { x: xOffset, y: yOffset } = getHoveredOffsetFromWell({
    selectedLabwareId,
    labwareState,
    wellName: hoveredWell,
    pipetteSpec,
    primaryNozzle,
    nozzleConfiguration: nozzles,
  })

  const { channels, pipetteBoundingBoxOffsets } = pipetteSpec
  const { backLeftCorner, frontRightCorner } = pipetteBoundingBoxOffsets
  const width = frontRightCorner[0] - backLeftCorner[0]
  const height = backLeftCorner[1] - frontRightCorner[1]

  const isError =
    !isAccessible ||
    (!hasPickupsRemaining && !isHoveredWellSelected && isTiprack)

  const shadowProps = {
    x: slotX + xOffset,
    y: slotY + yOffset,
    width,
    height,
    ...(isError
      ? {
          fill: `${COLORS.red50}${COLORS.opacity20HexCode}`,
          stroke: COLORS.red50,
        }
      : {
          fill: `${COLORS.black90}${COLORS.opacity20HexCode}`,
          stroke: COLORS.blue50,
        }),
    rotate,
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
  const isOt2EightChannel = robotType === OT2_ROBOT_TYPE && channels === 8
  const { x: labelOffsetX, y: labelOffsetY } = getLabelOffsetByPlacement({
    labelPlacement,
    labelWidth,
    labelHeight,
    shadowWidth: width,
    shadowHeight: height,
    isOt2EightChannel,
  })
  return (
    <g className={styles.shadow_overlay}>
      <PipetteLabel
        ref={labelRef}
        text={labelText}
        isZoomed
        x={slotX + xOffset + labelOffsetX}
        y={slotY + yOffset + labelOffsetY}
        placement={labelPlacement}
        isError={isError}
      />
      <ShadowComponent {...shadowProps} />
    </g>
  )
}
