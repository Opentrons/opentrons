// @flow
import i18n from '../../localization'
import * as React from 'react'
import { PDListItem } from '../lists'
import styles from './styles.css'
import {
  getLabwareDefURI,
  getLabwareDefIsStandard,
  getLabwareDisplayName,
  type LabwareDefinition2,
} from '@opentrons/shared-data'

type Props = {|
  selectLabware: (labwareLoadName: string) => mixed,
  labwareDef: LabwareDefinition2,
  onMouseEnter: () => any,
  onMouseLeave: () => any,
|}

const LABWARE_LIBRARY_PAGE_PATH = 'https://labware.opentrons.com'

export default function LabwareItem(props: Props) {
  const { selectLabware, onMouseLeave, onMouseEnter, labwareDef } = props

  const displayName = getLabwareDisplayName(labwareDef)
  const labwareURI = getLabwareDefURI(labwareDef)
  const labwareLoadName = labwareDef.parameters.loadName

  return (
    <PDListItem
      border
      hoverable
      className={styles.labware_list_item}
      onClick={() => selectLabware(labwareURI)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={styles.labware_name}>{displayName}</div>
      {getLabwareDefIsStandard(labwareDef) ? (
        <a
          className={styles.view_measurements_link}
          target="_blank"
          rel="noopener noreferrer"
          href={`${LABWARE_LIBRARY_PAGE_PATH}/${labwareLoadName}`}
          onClick={e => e.stopPropagation()}
        >
          {i18n.t('modal.labware_selection.view_measurements')}
        </a>
      ) : null}
    </PDListItem>
  )
}
