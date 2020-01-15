// @flow
// prompt for ReviewDeck of labware calibration page
import * as React from 'react'

import { getLabwareDisplayName } from '@opentrons/shared-data'
import { OutlineButton } from '@opentrons/components'
import { selectors as robotSelectors, type Labware } from '../../robot'

import styles from './styles.css'

type Props = {|
  ...Labware,
  onClick: () => void,
|}

export default function Prompt(props: Props) {
  const { onClick, ...labware } = props
  const { name, definition, slot } = labware
  const labwareType = robotSelectors.labwareType(labware)
  const labwareTitle = definition ? getLabwareDisplayName(definition) : name

  return (
    <div className={styles.prompt}>
      <p className={styles.prompt_text}>
        To calibrate deck, position full tipracks and empty labware in their
        designated slots as illustrated below
      </p>
      <OutlineButton
        className={styles.prompt_button}
        onClick={onClick}
        inverted
      >
        {`Continue moving to ${labwareType}`}
      </OutlineButton>
      <p className={styles.prompt_details}>
        {`Pipette will move to ${labwareTitle} in slot ${slot}`}
      </p>
    </div>
  )
}
