// @flow
import * as React from 'react'
import styles from './StepItem.css'

type LabwareTooltipContentsProps = {
  labwareNickname: ?string,
  labwareDefDisplayName: ?string,
}
const LabwareTooltipContents = (props: LabwareTooltipContentsProps) => {
  const { labwareNickname, labwareDefDisplayName } = props
  return (
    <div className={styles.labware_tooltip_contents}>
      <p className={styles.labware_name}>{labwareNickname}</p>
      {labwareNickname && (
        <React.Fragment>
          <div className={styles.labware_spacer} />
          <p>{labwareDefDisplayName}</p>
        </React.Fragment>
      )}
    </div>
  )
}

export default LabwareTooltipContents
