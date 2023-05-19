import * as React from 'react'
import cx from 'classnames'
import { SLOT_RENDER_WIDTH, SLOT_RENDER_HEIGHT } from '@opentrons/shared-data'
import styles from './LabwareOutline.css'

import type { CSSProperties } from 'styled-components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
export interface LabwareOutlineProps {
  definition?: LabwareDefinition2
  width?: number
  height?: number
  isTiprack?: boolean
  hover?: boolean
  stroke?: CSSProperties['stroke']
  highlight?: boolean
}

const OUTLINE_THICKNESS_MM = 1

export function LabwareOutline(props: LabwareOutlineProps): JSX.Element {
  const {
    definition,
    width = SLOT_RENDER_WIDTH,
    height = SLOT_RENDER_HEIGHT,
    isTiprack,
    stroke,
    hover,
    highlight,
  } = props
  const {
    parameters = { isTiprack },
    dimensions = { xDimension: width, yDimension: height },
  } = definition || {}

  return (
    <>
    {highlight ? (
        <g opacity="0">
          <path
            d="M158.027 111.537L154.651 108.186M145.875 113L145.875 109.253M161 99.3038L156.864 99.3038M11.9733 10.461L15.3495 13.8128M24.1255 9L24.1254 12.747M9 22.6962L13.1357 22.6962"
            stroke="#006CFA"
            strokeWidth="3.57"
            strokeLinecap="round"
            transform="scale(.97, -1) translate(-19, -104) "
          ></path>
          <animate
            id="splash"
            attributeName="opacity"
            begin={`labware-move.end+2s`}
            dur="300ms"
            from="0"
            to="1"
            calcMode="ease-out"
            fill="freeze"
          />
        </g>
      ) : null}
      <rect
        x={OUTLINE_THICKNESS_MM}
        y={OUTLINE_THICKNESS_MM}
        strokeWidth={OUTLINE_THICKNESS_MM}
        width={dimensions.xDimension - 2 * OUTLINE_THICKNESS_MM}
        height={dimensions.yDimension - 2 * OUTLINE_THICKNESS_MM}
        rx={6 * OUTLINE_THICKNESS_MM}
        className={cx(styles.labware_outline, {
          [styles.tiprack_outline]: parameters && parameters.isTiprack,
          [styles.hover_outline]: hover,
          [styles.labware_outline_highlight]: highlight,
        })}
        style={{ stroke }}
      />
    </>
  )
}
