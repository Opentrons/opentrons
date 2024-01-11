import * as React from 'react'

import {
  THERMOCYCLER_MODULE_V1,
  ThermocyclerModuleModel,
  getModuleDef2,
} from '@opentrons/shared-data'

import { C_MED_LIGHT_GRAY } from '../../../styles'
import { LEGACY_COLORS, BORDERS } from '../../../ui-style-constants'

import { RobotCoordsForeignDiv } from '../../Deck'
import { ThermocyclerGEN1 } from './ThermocyclerGEN1'
import { ThermocyclerGEN2 } from './ThermocyclerGEN2'

const ROOM_TEMPERATURE_C = 23 // value taken from TC firmware
export interface ThermocyclerVizProps {
  lidMotorState: 'open' | 'closed' | 'unknown'
  blockTargetTemp?: number | null
  model: ThermocyclerModuleModel
}

export function Thermocycler(props: ThermocyclerVizProps): JSX.Element {
  const { lidMotorState, blockTargetTemp, model } = props
  const def = getModuleDef2(model)
  if (lidMotorState === 'unknown') {
    // just a rectangle if we don't know the state of the lid
    return (
      <RobotCoordsForeignDiv
        width={def.dimensions.xDimension}
        height={def.dimensions.yDimension}
        innerDivProps={{
          borderRadius: '6px',
          backgroundColor: C_MED_LIGHT_GRAY,
          border: BORDERS.lineBorder,
          width: '100%',
          height: '100%',
        }}
      />
    )
  }

  let ledLightColor = LEGACY_COLORS.transparent
  if (blockTargetTemp != null) {
    ledLightColor =
      blockTargetTemp <= ROOM_TEMPERATURE_C
        ? LEGACY_COLORS.mediumBlueEnabled
        : LEGACY_COLORS.red4
  }

  return model === THERMOCYCLER_MODULE_V1 ? (
    <ThermocyclerGEN1 {...{ lidMotorState, ledLightColor }} />
  ) : (
    <ThermocyclerGEN2 {...{ lidMotorState, ledLightColor }} />
  )
}
