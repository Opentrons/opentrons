// @flow
import * as React from 'react'
import type {Labware} from '../../labware-ingred/types'
import {labwareToDisplayName} from '../../labware-ingred/utils'
import styles from './StepItem.css'

type LabwareTooltipContentsProps = {labware: ?Labware}
const LabwareTooltipContents = ({labware}: LabwareTooltipContentsProps) => {
  const displayName = labware && labwareToDisplayName(labware)
  return (
    <div className={styles.labware_tooltip_contents}>
      <span>{displayName}</span>
      {labware && labware.type !== displayName &&
        <span className={styles.labware_type}>{labware && labware.type}</span>
      }
    </div>
  )
}

export default LabwareTooltipContents
