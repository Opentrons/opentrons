import * as React from 'react'
import parseHtml from 'html-react-parser'
import { stringify } from 'svgson'

import type { INode } from 'svgson'
import type { DeckDefinition } from '@opentrons/shared-data'

export interface DeckFromDataProps {
  def: DeckDefinition
  layerBlocklist: string[]
}

// recursively filter layer and children nodes by blocklist
function filterLayerGroupNodes(
  layers: INode[],
  layerBlocklist: string[]
): INode[] {
  return layers.reduce((acc: INode[], layer) => {
    if (layerBlocklist.includes(layer.attributes?.id)) return acc

    const filteredLayerChildren = filterLayerGroupNodes(
      layer.children,
      layerBlocklist
    )

    return acc.concat({ ...layer, children: filteredLayerChildren })
  }, [])
}

export function DeckFromData(props: DeckFromDataProps): JSX.Element {
  const { def, layerBlocklist = [] } = props

  const layerGroupNodes = filterLayerGroupNodes(def.layers, layerBlocklist)

  const groupNodeWrapper = {
    name: 'g',
    type: 'element',
    value: '',
    attributes: { id: 'deckLayers' },
    children: layerGroupNodes,
  }

  return (
    <>
      {parseHtml(
        // TODO(bh, 2023-7-12): use svgson stringify option to apply individual attributes https://github.com/elrumordelaluz/svgson#svgsonstringify
        // the goal would be to give more styling control over individual deck map elements
        stringify(groupNodeWrapper, {
          selfClose: false,
        })
      )}
    </>
  )
}
