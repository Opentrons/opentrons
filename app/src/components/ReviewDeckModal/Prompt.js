// @flow
// prompt for ReviewDeckModal of labware calibration page
import * as React from 'react'

import {selectors as robotSelectors, type Labware} from '../../robot'
import {OutlineButton} from '@opentrons/components'

import styles from './styles.css'

type Props = Labware & {
  onClick: () => void,
}

export default function Prompt (props: Props) {
  const {type, slot, onClick} = props
  const labwareType = robotSelectors.labwareType(props)

  return (
    <div className={styles.prompt}>
      <p className={styles.prompt_text}>
        To calibrate deck, position full tipracks and empty labware in their
        designated slots as illustrated below
      </p>
      <OutlineButton className={styles.prompt_button} onClick={onClick} inverted>
        {`Continue moving to ${labwareType}`}
      </OutlineButton>
      <p className={styles.prompt_details}>
        {`Pipette will move to ${type} in slot ${slot}`}
      </p>
    </div>
  )
}
