// TODO: BC 2021-08-03 we should migrate to only using the ModuleFromData
// component; once legacy Module viz is removed, we should rename it Module

import * as React from 'react'
import parseHtml from 'html-react-parser'
import { stringify } from 'svgson'

import { THERMOCYCLER_MODULE_V1, getModuleDef2 } from '@opentrons/shared-data'

import { RobotCoordsForeignDiv } from '../Deck'
import { ModuleFromDef } from './ModuleFromDef'

import { C_MED_LIGHT_GRAY } from '../../styles'

export interface ThermocyclerVizProps {
  lidMotorState: 'open' | 'closed' | 'unknown'
}

export function Thermocycler(props: ThermocyclerVizProps): JSX.Element {
  const { lidMotorState } = props
  const def = getModuleDef2(THERMOCYCLER_MODULE_V1)
  if (lidMotorState === 'unknown') { // just a rectangle if we don't know the state of the lid
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
      const {id} = layer.attributes
      if (id != null && id.startsWith(lidMotorState === 'open' ? 'closed' : 'open')){
        return [...layerBlockList, id]
      }
      return layerBlockList
    },
    []
  )
  return (
    <ModuleFromDef def={def} layerBlocklist={layerBlocklist} />
  )
}