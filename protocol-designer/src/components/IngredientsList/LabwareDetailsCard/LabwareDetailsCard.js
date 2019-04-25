// @flow
import React from 'react'
import cx from 'classnames'
import i18n from '../../../localization'
import { PDTitledList, PDListItem } from '../../lists'
import EditableTextField from '../../EditableTextField'
import styles from './labwareDetailsCard.css'

type Props = {
  labwareDefDisplayName: string,
  nickname: string,
  renameLabware: (name: string) => mixed,
}

export default function LabwareDetailsCard(props: Props) {
  return (
    <PDTitledList title="labware details" iconName="flask-outline">
      <PDListItem>
        <div className={styles.row}>
          <span className={cx(styles.label, styles.column_1_3)}>
            {i18n.t('form.generic.labware_type')}
          </span>
          <span className={styles.column_2_3}>
            {props.labwareDefDisplayName}
          </span>
        </div>
      </PDListItem>
      <PDListItem border>
        <div className={styles.row}>
          <span className={cx(styles.label, styles.column_1_3)}>
            {i18n.t('form.generic.nickname')}
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
