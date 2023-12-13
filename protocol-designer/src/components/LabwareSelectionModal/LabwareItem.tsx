import * as React from 'react'
import cx from 'classnames'
import { i18n } from '../../localization'
import { Icon, IconName } from '@opentrons/components'
import { PDListItem } from '../lists'
import styles from './styles.module.css'
import {
  getLabwareDefURI,
  getLabwareDefIsStandard,
  getLabwareDisplayName,
  LabwareDefinition2,
} from '@opentrons/shared-data'

interface Props {
  disabled?: boolean | null
  icon?: IconName | null
  labwareDef: LabwareDefinition2
  onMouseEnter: () => any
  onMouseLeave: () => any
  selectLabware: (labwareLoadName: string) => unknown
}

const LABWARE_LIBRARY_PAGE_PATH = 'https://labware.opentrons.com'

export function LabwareItem(props: Props): JSX.Element {
  const {
    disabled,
    icon,
    labwareDef,
    onMouseLeave,
    onMouseEnter,
    selectLabware,
  } = props

  const displayName = getLabwareDisplayName(labwareDef)
  const labwareURI = getLabwareDefURI(labwareDef)
  const labwareLoadName = labwareDef.parameters.loadName

  return (
    <PDListItem
      border
      hoverable
      className={styles.labware_list_item}
      onClick={() => {
        if (!disabled) {
          selectLabware(labwareURI)
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {icon ? <Icon name={icon} className={styles.labware_item_icon} /> : null}
      <div className={cx(styles.labware_name, { [styles.disabled]: disabled })}>
        {displayName}
      </div>
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
