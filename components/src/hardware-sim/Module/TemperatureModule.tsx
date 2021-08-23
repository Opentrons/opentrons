import * as React from 'react'
import parseHtml from 'html-react-parser'
import { stringify } from 'svgson'

import { TEMPERATURE_MODULE_V2, getModuleDef2 } from '@opentrons/shared-data'

export function TemperatureModule(): JSX.Element {
  const def = getModuleDef2(TEMPERATURE_MODULE_V2)
  return (
    <g transform={`translate(${def.cornerOffsetFromSlot.x},${def.cornerOffsetFromSlot.y})`}>
      {parseHtml(stringify(def.twoDimensionalRendering.children, {selfClose: false}))}
    </g>
  )
}