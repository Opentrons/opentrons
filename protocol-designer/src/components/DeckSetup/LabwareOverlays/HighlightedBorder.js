// @flow
import React from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

import styles from './LabwareOverlays.css'

type Props = {|
  definition: ?LabwareDefinition2,
|}

const HighlightedBorder = (props: Props) => {
  const { definition } = props

  return (
    <rect
      width={definition.dimensions.xDimension}
      height={definition.dimensions.yDimension}
      className={styles.highlighted_border}
    />
  )
}

export default HighlightedBorder
