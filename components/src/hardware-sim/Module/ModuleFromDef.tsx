import * as React from 'react'
import parseHtml from 'html-react-parser'
import { stringify } from 'svgson'

import type { ModuleDefinition } from '@opentrons/shared-data'

export interface ModuleFromDataProps {
  def: ModuleDefinition
  layerBlocklist?: string[]
  standaloneSVG?: boolean
}

export function ModuleFromDef(props: ModuleFromDataProps): JSX.Element {
  const { def, layerBlocklist = [], standaloneSVG = false} = props

  const layerGroupNodes = def.twoDimensionalRendering.children.filter(
    g => !layerBlocklist.includes(g.attributes?.id)
  )
  const groupNodeWrapper= {
    name: 'g',
    type: 'element',
    value: '',
    attributes: {id: 'moduleVisualization'},
    children: layerGroupNodes
  }
  const filteredSVGWrapper = {
    ...def.twoDimensionalRendering,
    children: layerGroupNodes
  }

  return (
    <g>
      {parseHtml(stringify(standaloneSVG ? filteredSVGWrapper: groupNodeWrapper, {selfClose: false}))}
    </g>
  )
}