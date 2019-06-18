// @flow
import * as React from 'react'
import cx from 'classnames'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import styles from './Labware.css'

type Props = {
  definition: LabwareDefinition2,
  className?: ?string,
}

const OUTLINE_THICKNESS_MM = 1

export default function LabwareOutline(props: Props) {
  const { isTiprack } = props.definition.parameters
  return (
    <rect
      x={OUTLINE_THICKNESS_MM}
      y={OUTLINE_THICKNESS_MM}
      strokeWidth={OUTLINE_THICKNESS_MM}
      width={props.definition.dimensions.xDimension - 2 * OUTLINE_THICKNESS_MM}
      height={props.definition.dimensions.yDimension - 2 * OUTLINE_THICKNESS_MM}
      rx={6 * OUTLINE_THICKNESS_MM}
      className={cx(styles.labware_outline, {
        [styles.tiprack_outline]: isTiprack,
      })}
    />
  )
}
