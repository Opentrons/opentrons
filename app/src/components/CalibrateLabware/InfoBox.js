// @flow
// info panel for labware calibration page
import * as React from 'react'
import capitalize from 'lodash/capitalize'

import { getLabwareDisplayName } from '@opentrons/shared-data'
import { Icon } from '@opentrons/components'
import styles from './styles.css'

import { selectors as robotSelectors } from '../../robot'
import { InfoBoxButton } from './InfoBoxButton'

import type { Labware, LabwareType } from '../../robot/types'

export type InfoBoxProps = {| labware: ?Labware |}

export function InfoBox(props: InfoBoxProps): React.Node {
  const { labware } = props

  let title = 'No labware selected'
  let iconName = 'checkbox-blank-circle-outline'
  let description = 'Please select labware to continue'

  if (labware) {
    const labwareType: LabwareType = robotSelectors.labwareType(labware)
    title = labware.definition
      ? getLabwareDisplayName(labware.definition)
      : labware.type

    if (labware.confirmed) {
      iconName = 'check-circle'
      description = `${capitalize(labwareType)} is calibrated`
    } else {
      description = `${capitalize(labwareType)} is not yet calibrated`
    }
  }

  return (
    <div className={styles.info_box}>
      <div className={styles.info_box_left}>
        <h2 className={styles.info_box_title}>
          <Icon name={iconName} className={styles.info_box_icon} />
          {title}
        </h2>
        <div className={styles.info_box_description}>{description}</div>
      </div>
      <InfoBoxButton labware={labware} />
    </div>
  )
}
