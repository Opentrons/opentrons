// TODO: BC 2021-08-03 we should migrate to only using the ModuleFromData
// component; once legacy Module viz is removed, we should rename it Module

import * as React from 'react'

import { THERMOCYCLER_MODULE_V1, getModuleDef2 } from '@opentrons/shared-data'

import { C_MED_LIGHT_GRAY } from '../../styles'
import { COLORS, BORDERS } from '../../ui-style-constants'

import { RobotCoordsForeignDiv } from '../Deck'
import { ModuleFromDef } from './ModuleFromDef'

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
          border: BORDERS.lineBorder,
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
          backgroundColor:
            blockTargetTemp <= ROOM_TEMPERATURE_C
              ? COLORS.mediumBlueEnabled
              : COLORS.red4,
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
