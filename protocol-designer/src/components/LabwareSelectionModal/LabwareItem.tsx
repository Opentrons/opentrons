import * as React from 'react'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'
import { Icon, IconName } from '@opentrons/components'
import { PDListItem } from '../lists'
import styles from './styles.css'
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
  const { t } = useTranslation('modal')
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
          {t('labware_selection.view_measurements')}
        </a>
      ) : null}
    </PDListItem>
  )
}
