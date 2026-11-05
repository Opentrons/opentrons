import {
  COLORS,
  INACCESSIBLE,
  SELECTED,
  StrokedNozzles,
  UNSELECTED,
} from '@opentrons/components'
import {
  A1_NOZZLE,
  ALL,
  COLUMN,
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
  PARTIAL_COLUMN,
  ROW,
} from '@opentrons/shared-data'

import { EightChannelFlexShadow } from '../TipSelectionWizard/PipetteShadows/EightChannelFlexShadow'
import { EightChannelOT2Shadow } from '../TipSelectionWizard/PipetteShadows/EightChannelOT2Shadow'
import { NinetySixChannelFlexShadow } from '../TipSelectionWizard/PipetteShadows/NinetySixChannelFlexShadow'
import { SingleChannelOT2Shadow } from '../TipSelectionWizard/PipetteShadows/SingleChannelOT2Shadow'
import { SingleChannelFlexShadow } from '../TipSelectionWizard/PipetteShadows/SingleChannelShadow'
import styles from './nozzleandwellwizard.module.css'
import { getAvailablePrimaryNozzles, getEntireWellSelection } from './utils'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { Channels, WellType } from '@opentrons/components'
import type {
  ActiveNozzleNumber,
  NozzleConfigurationStyle,
  PipetteV2Specs,
  PrimaryNozzleConfigurationStyle,
  RobotType,
} from '@opentrons/shared-data'
import type { FieldPropsByName } from '../../types'
import type { PipetteShadowProps } from '../TipSelectionWizard/types'

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

interface NozzleRenderProps {
  robotType: RobotType
  pipetteSpecs: PipetteV2Specs
  propsForFields: FieldPropsByName
  selectedNozzle: string[]
  setSelectedNozzle: Dispatch<SetStateAction<string[]>>
}

const getAvailableNozzles = (
  nozzleConfiguration: NozzleConfigurationStyle,
  params: {
    allNozzles: string[]
    nozzles: string[]
    wellOrdering: string[][]
    primaryNozzle: PrimaryNozzleConfigurationStyle
    channels: ActiveNozzleNumber
  }
): string[] => {
  const { allNozzles, nozzles, wellOrdering, primaryNozzle, channels } = params

  if (nozzleConfiguration === ALL) {
    return allNozzles
  }

  if (nozzleConfiguration === COLUMN || nozzleConfiguration === ROW) {
    return nozzles.flatMap(nozzle =>
      getEntireWellSelection(
        nozzle,
        wellOrdering,
        nozzleConfiguration,
        primaryNozzle,
        channels
      )
    )
  }

  return nozzles
}
export function NozzleRender(props: NozzleRenderProps): ReactNode {
  const {
    robotType,
    pipetteSpecs,
    propsForFields,
    selectedNozzle,
    setSelectedNozzle,
  } = props
  const { channels, pipetteBoundingBoxOffsets, nozzleMap, orderedColumns } =
    pipetteSpecs
  const primaryNozzle =
    (propsForFields.primaryNozzle.value as PrimaryNozzleConfigurationStyle) ??
    A1_NOZZLE
  const nozzleConfiguration =
    (propsForFields.nozzles.value as NozzleConfigurationStyle) ?? ALL

  const OutlineComponent =
    SHADOW_BY_ROBOT_TYPE_AND_CHANNELS[robotType][channels]
  const is96Channel = channels === 96
  const { backLeftCorner, frontRightCorner } = pipetteBoundingBoxOffsets
  const width = frontRightCorner[0] - backLeftCorner[0]
  const height = backLeftCorner[1] - frontRightCorner[1]
  const outlineProps = {
    fill: COLORS.white,
    stroke: COLORS.grey50,
    x: 0,
    y: 0,
    width,
    height,
    rotate: !is96Channel,
  }
  const availableNozzlesOptions = getAvailablePrimaryNozzles(
    channels,
    nozzleConfiguration
  )
  const allNozzles = Object.keys(nozzleMap)
  const isPartial = nozzleConfiguration === PARTIAL_COLUMN
  const nozzles = availableNozzlesOptions.map(nozzle => nozzle.value)
  const wellOrdering = Object.values(orderedColumns).map(
    column => column.orderedNozzles
  )
  const params = {
    allNozzles,
    nozzles,
    wellOrdering,
    primaryNozzle,
    channels,
  }
  const availableNozzles = getAvailableNozzles(nozzleConfiguration, params)

  const nozzleStatus: Record<string, WellType> = Object.fromEntries(
    Object.entries(nozzleMap).map(([wellName]) => {
      let status: WellType

      if (selectedNozzle?.includes(wellName)) {
        status = SELECTED
      } else if (availableNozzles.includes(wellName) && !isPartial) {
        status = UNSELECTED
      } else {
        status = INACCESSIBLE
      }

      return [wellName, status]
    })
  )
  const handleClickNozzle = (nozzleName: string): void => {
    const isAccessible = nozzleStatus[nozzleName] !== INACCESSIBLE
    if (isAccessible) {
      const nozzlesToSelect = getEntireWellSelection(
        nozzleName,
        wellOrdering,
        nozzleConfiguration,
        primaryNozzle,
        channels
      )
      setSelectedNozzle(nozzlesToSelect)
      propsForFields.primaryNozzle.updateValue(nozzlesToSelect[0])
    }
  }
  const viewBox = `0 0 ${width} ${height}`

  return (
    <div className={styles.nozzle_render}>
      <svg width="100%" height="100%" viewBox={viewBox}>
        <OutlineComponent {...outlineProps} />
        <StrokedNozzles
          pipetteSpecs={pipetteSpecs}
          nozzleStatus={nozzleStatus}
          handleClickNozzle={handleClickNozzle}
        />
      </svg>
    </div>
  )
}
