// TODO: BC 2021-08-03 we should migrate to only using the ModuleFromData
// component; once legacy Module viz is removed, we should rename it Module

import * as React from 'react'

import { THERMOCYCLER_MODULE_V1, getModuleDef2 } from '@opentrons/shared-data'

import { RobotCoordsForeignDiv } from '../Deck'
import { ModuleFromDef } from './ModuleFromDef'

import { C_MED_LIGHT_GRAY } from '../../styles'
import { COLORS } from '../../ui-style-constants'

const ROOM_TEMPERATURE_C = 23 // value taken from TC firmware
export interface ThermocyclerVizProps {
  lidMotorState: 'open' | 'closed' | 'unknown'
  blockTargetTemp: number | null
}

export function Thermocycler(props: ThermocyclerVizProps): JSX.Element {
  const { lidMotorState, blockTargetTemp } = props
  const def = getModuleDef2(THERMOCYCLER_MODULE_V1)
  if (lidMotorState === 'unknown') {
    // just a rectangle if we don't know the state of the lid
    return (
      <RobotCoordsForeignDiv
        width={def.dimensions.xDimension}
        height={def.dimensions.yDimension}
        innerDivProps={{
          borderRadius: '6px',
          backgroundColor: C_MED_LIGHT_GRAY,
          width: '100%',
          height: '100%',
        }}
      />
    )
  }
  const layerBlocklist = def.twoDimensionalRendering.children.reduce<string[]>(
    (layerBlockList, layer) => {
      const { id } = layer.attributes
      if (
        id != null &&
        id.startsWith(lidMotorState === 'open' ? 'closed' : 'open')
      ) {
        return [...layerBlockList, id]
      }
      return layerBlockList
    },
    []
  )
  let ledLightOverlay = null
  if (blockTargetTemp != null) {
    ledLightOverlay = (
      <RobotCoordsForeignDiv
        width="100"
        height="10"
        x="36"
        y="22"
        innerDivProps={{
          borderRadius: '6px',
          backgroundColor: blockTargetTemp <= ROOM_TEMPERATURE_C ? COLORS.blueEnabled : COLORS.red2,
          width: '100%',
          height: '100%',
        }}
      />
    )
  }

  return (
    <>
      <ModuleFromDef def={def} layerBlocklist={layerBlocklist} />
      {ledLightOverlay}
    </>
  )
}

// Order is WRGB
// // Brights are being toned down
// #define COLOR_TABLE \
//   COLOR_DEF(soft_white, 0xee000000), \
//   COLOR_DEF(white, 0x00eeeeee),      \
//   COLOR_DEF(red, 0x00500000),        \
//   COLOR_DEF(green, 0x0000ee00),      \
//   COLOR_DEF(blue, 0x000000ff),       \
//   COLOR_DEF(orange, 0x00ff5300),     \
//   COLOR_DEF(none, 0x00000000)