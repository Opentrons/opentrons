// @flow
import * as React from 'react'
import cx from 'classnames'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import { SLOT_RENDER_WIDTH, SLOT_RENDER_HEIGHT } from '@opentrons/shared-data'
import styles from './Labware.css'

export type LabwareOutlineProps = {|
  definition?: LabwareDefinition2,
  width?: number,
  height?: number,
  isTiprack?: boolean,
|}

const OUTLINE_THICKNESS_MM = 1

export function LabwareOutline(props: LabwareOutlineProps): React.Node {
  const {
    definition,
    width = SLOT_RENDER_WIDTH,
    height = SLOT_RENDER_HEIGHT,
    isTiprack,
  } = props
  const {
    parameters = { isTiprack },
    dimensions = { xDimension: width, yDimension: height },
  } = definition || {}

  return (
    <rect
      x={OUTLINE_THICKNESS_MM}
      y={OUTLINE_THICKNESS_MM}
      strokeWidth={OUTLINE_THICKNESS_MM}
      width={dimensions.xDimension - 2 * OUTLINE_THICKNESS_MM}
      height={dimensions.yDimension - 2 * OUTLINE_THICKNESS_MM}
      rx={6 * OUTLINE_THICKNESS_MM}
      className={cx(styles.labware_outline, {
        [styles.tiprack_outline]: parameters && parameters.isTiprack,
      })}
    />
  )
}
