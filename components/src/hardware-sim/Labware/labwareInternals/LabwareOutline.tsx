import * as React from 'react'
import cx from 'classnames'
import { SLOT_RENDER_WIDTH, SLOT_RENDER_HEIGHT } from '@opentrons/shared-data'
import { COLORS } from '../../../ui-style-constants'
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
  isOnDevice?: boolean
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
    isOnDevice = false,
  } = props
  const {
    parameters = { isTiprack },
    dimensions = { xDimension: width, yDimension: height },
  } = definition || {}
  return (
    <>
      {isOnDevice ? (
        <svg>
          <defs>
            <filter id="feOffset" filterUnits="objectBoundingBox">
              <feOffset dx="2" dy="2" />
              <feGaussianBlur stdDeviation="5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect
            x={0.5 * OUTLINE_THICKNESS_MM}
            y={0.5 * OUTLINE_THICKNESS_MM}
            strokeWidth={OUTLINE_THICKNESS_MM}
            width={dimensions.xDimension + 2.5 * OUTLINE_THICKNESS_MM}
            height={dimensions.yDimension + 2.5 * OUTLINE_THICKNESS_MM}
            rx="8"
            ry="8"
            filter="url(#feOffset)"
            style={{
              stroke: '#74B0FF',
              strokeWidth: '3px',
            }}
          />
          <rect
            x={1.5 * OUTLINE_THICKNESS_MM}
            y={1.5 * OUTLINE_THICKNESS_MM}
            strokeWidth={OUTLINE_THICKNESS_MM}
            width={dimensions.xDimension - OUTLINE_THICKNESS_MM}
            height={dimensions.yDimension - OUTLINE_THICKNESS_MM}
            rx="4"
            ry="4"
            style={{
              stroke: `${COLORS.blueEnabled}`,
              strokeWidth: '3px',
              fillOpacity: 0.1,
            }}
          />
        </svg>
      ) : (
        <rect
          x={OUTLINE_THICKNESS_MM}
          y={OUTLINE_THICKNESS_MM}
          strokeWidth={OUTLINE_THICKNESS_MM}
          width={dimensions.xDimension + 2 * OUTLINE_THICKNESS_MM}
          height={dimensions.yDimension + 2 * OUTLINE_THICKNESS_MM}
          rx={6 * OUTLINE_THICKNESS_MM}
          className={cx(styles.labware_outline, {
            [styles.tiprack_outline]: parameters && parameters.isTiprack,
            [styles.hover_outline]: hover,
            [styles.labware_outline_highlight]: highlight,
          })}
          style={{ stroke }}
        />
      )}
    </>
  )
}
