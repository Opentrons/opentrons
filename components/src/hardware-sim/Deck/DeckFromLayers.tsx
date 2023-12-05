import * as React from 'react'
import parseHtml from 'html-react-parser'
import { stringify } from 'svgson'

import ot2DeckDefV3 from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import type { INode } from 'svgson'
import type { RobotType } from '@opentrons/shared-data'

export interface DeckFromLayersProps {
  robotType: RobotType
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

/**
 * a component that renders an OT-2 deck from the V3 deck definition layers property
 * takes a robot type prop to protect against an attempted Flex render
 */
export function DeckFromLayers(props: DeckFromLayersProps): JSX.Element | null {
  const { robotType, layerBlocklist = [] } = props

  // early return null if not OT-2
  if (robotType !== OT2_ROBOT_TYPE) return null

  // get layers from OT-2 deck definition v3
  const layerGroupNodes = filterLayerGroupNodes(
    ot2DeckDefV3.layers,
    layerBlocklist
  )

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
