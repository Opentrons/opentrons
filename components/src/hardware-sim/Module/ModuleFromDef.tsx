import * as React from 'react'
import parseHtml from 'html-react-parser'
import { stringify } from 'svgson'

import type { ModuleDefinition } from '@opentrons/shared-data'

export interface ModuleFromDataProps {
  def: ModuleDefinition
  layerBlocklist?: string[]
}

export function ModuleFromDef(props: ModuleFromDataProps): JSX.Element {
  const { def, layerBlocklist = []} = props

  const layerGroupNodes = def.twoDimensionalRendering.children.filter(
    g => !layerBlocklist.includes(g.attributes?.id)
  )

  return (
    <g>
      {parseHtml(stringify(layerGroupNodes, {selfClose: false}))}
    </g>
  )
}