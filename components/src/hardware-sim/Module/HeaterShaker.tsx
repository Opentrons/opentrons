import * as React from 'react'

import { getModuleDef2, HEATERSHAKER_MODULE_V1 } from '@opentrons/shared-data'

import { COLORS } from '../../ui-style-constants'
import { RobotCoordsForeignDiv } from '../Deck'
import { ModuleFromDef } from './ModuleFromDef'

export interface HeaterShakerVizProps {
  targetTemp: number | null
}

export function HeaterShaker(props: HeaterShakerVizProps): JSX.Element {
  const { targetTemp } = props
  const def = getModuleDef2(HEATERSHAKER_MODULE_V1)
  let ledLightOverlay: JSX.Element | null = null
  if (targetTemp != null) {
    ledLightOverlay = (
      <RobotCoordsForeignDiv
        width="3.5"
        height="16"
        x="5"
        y="38"
        innerDivProps={{
          borderRadius: '6px',
          backgroundColor: COLORS.red4,
          width: '100%',
          height: '100%',
        }}
      />
    )
  }

  return (
    <>
      <ModuleFromDef def={def} />
      {ledLightOverlay}
    </>
  )
}
