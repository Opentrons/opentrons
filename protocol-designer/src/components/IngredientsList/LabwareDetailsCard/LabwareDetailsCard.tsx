import * as React from 'react'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'
import { PDTitledList, PDListItem } from '../../lists'
import { EditableTextField } from '../../EditableTextField'
import styles from './labwareDetailsCard.css'

export interface Props {
  labwareDefDisplayName: string
  nickname: string
  renameLabware: (name: string) => unknown
}

export function LabwareDetailsCard(props: Props): JSX.Element {
  const { t } = useTranslation('form')
  return (
    <PDTitledList title="labware details" iconName="flask-outline">
      <PDListItem>
        <div className={styles.row}>
          <span className={cx(styles.label, styles.column_1_3)}>
            {t('generic.labware_type')}
          </span>
          <span className={styles.column_2_3}>
            {props.labwareDefDisplayName}
          </span>
        </div>
      </PDListItem>
      <PDListItem border>
        <div className={styles.row}>
          <span className={cx(styles.label, styles.column_1_3)}>
            {t('generic.nickname')}
          </span>
          <EditableTextField
            value={props.nickname}
            saveEdit={props.renameLabware}
          />
        </div>
      </PDListItem>
    </PDTitledList>
  )
}
