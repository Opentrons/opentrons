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
      <p className={styles.labware_name}>{displayName}</p>
      {labware && labware.type !== displayName &&
        <React.Fragment>
          <div className={styles.labware_spacer} />
          <p>{labware && labware.type}</p>
        </React.Fragment>
      }
    </div>
  )
}

export default LabwareTooltipContents
