import { COLORS, StrokedNozzles, StrokedWells } from '@opentrons/components'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { EightChannelFlexShadow } from '../TipSelectionWizard/PipetteShadows/EightChannelFlexShadow'
import { EightChannelOT2Shadow } from '../TipSelectionWizard/PipetteShadows/EightChannelOT2Shadow'
import { NinetySixChannelFlexShadow } from '../TipSelectionWizard/PipetteShadows/NinetySixChannelFlexShadow'
import { SingleChannelOT2Shadow } from '../TipSelectionWizard/PipetteShadows/SingleChannelOT2Shadow'
import { SingleChannelFlexShadow } from '../TipSelectionWizard/PipetteShadows/SingleChannelShadow'
import styles from './nozzleandwellwizard.module.css'
import { getAvailablePrimaryNozzles } from './utils'
import type { Channels } from '@opentrons/components'
import type {
  PipetteV2Specs,
  PrimaryNozzleConfigurationStyle,
  RobotType,
} from '@opentrons/shared-data'
import type { PipetteShadowProps } from '../TipSelectionWizard/types'

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

interface NozzleRenderProps {
  robotType: RobotType
  pipetteSpecs: PipetteV2Specs
  nozzleConfigurationStyle: PrimaryNozzleConfigurationStyle
}

export function NozzleRender(props: NozzleRenderProps): JSX.Element {
  const { robotType, pipetteSpecs, nozzleConfigurationStyle } = props
  const { channels, pipetteBoundingBoxOffsets, nozzleMap } = pipetteSpecs
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
    width: width,
    height: height,
    rotate: is96Channel,
  } 
  const availableNozzles = getAvailablePrimaryNozzles(channels, nozzleConfigurationStyle)
  const wellStroke = Object.fromEntries(Object.entries(nozzleMap).map(([wellName, _]) => {
    return [
      wellName,
      {wellName in availableNozzles ? COLORS.blue50 : COLORS.white50 }
    ]
  })).
  return (
    <div className={styles.nozzle_render}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        <OutlineComponent {...outlineProps} />
        <StrokedNozzles pipetteSpecs={pipetteSpecs} strokeByWell={wellStroke}/>
      </svg>
    </div>
  )
}
