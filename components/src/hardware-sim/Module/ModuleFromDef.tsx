import * as React from 'react'
import parseHtml from 'html-react-parser'
import { stringify } from 'svgson'

import type { ModuleDefinition } from '@opentrons/shared-data'

export interface ModuleFromDataProps {
  def: ModuleDefinition
  layerBlocklist?: string[]
  standaloneSVG?: boolean // default is false (wrapping tag is <g>), if true wrapping tag will be <svg>
}

export function ModuleFromDef(props: ModuleFromDataProps): JSX.Element {
  const { def, layerBlocklist = [], standaloneSVG = false } = props

  const layerGroupNodes = def.twoDimensionalRendering.children.filter(
    g => !layerBlocklist.includes(g.attributes?.id)
  )
  const groupNodeWrapper = {
    name: 'g',
    type: 'element',
    value: '',
    attributes: { id: 'moduleVisualization' },
    children: layerGroupNodes,
  }
  const filteredSVGWrapper = {
    ...def.twoDimensionalRendering,
    children: layerGroupNodes,
  }

<<<<<<< Updated upstream
=======
  let ledLightOverlay: JSX.Element | null = null

  if (def.moduleType === TEMPERATURE_MODULE_TYPE) {
    if (targetTemperature != null) {
      ledLightOverlay = (
        <RobotCoordsForeignDiv
          width="6"
          height="18"
          x="23"
          y="36.5"
          innerDivProps={{
            borderRadius: '6px',
            backgroundColor:
              targetTemperature <= ROOM_TEMPERATURE_C
                ? COLORS.mediumBlueEnabled
                : COLORS.red4,
            width: '100%',
            height: '100%',
          }}
        />
      )
    }
  } else if (def.moduleType === HEATERSHAKER_MODULE_TYPE) {
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
  }

>>>>>>> Stashed changes
  return (
    <g>
      {parseHtml(
        stringify(standaloneSVG ? filteredSVGWrapper : groupNodeWrapper, {
          selfClose: false,
        })
      )}
    </g>
  )
}
