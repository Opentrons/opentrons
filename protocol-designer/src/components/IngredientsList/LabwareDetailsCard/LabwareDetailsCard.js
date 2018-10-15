// @flow
import React from 'react'
import cx from 'classnames'
import i18n from '../../../localization'
import {PDTitledList, PDListItem} from '../../lists'
import styles from './labwareDetailsCard.css'

type Props = {
  labwareType: string,
  nickname: string,
}

export default function LabwareDetailsCard (props: Props) {
  return (
    <PDTitledList
      title='labware details'
      iconName='flask-outline'
    >
      <PDListItem>
        <div className={styles.row}>
          <span className={cx(styles.label, styles.column_1_3)}>
            {i18n.t('form.labware.type')}
          </span>
          <span className={styles.column_2_3}>{props.labwareType}</span>
        </div>
      </PDListItem>
      <PDListItem border>
        <div className={styles.row}>
          <span className={cx(styles.label, styles.column_1_3)}>
            {i18n.t('form.liquid.nickname')}
          </span>
          <span className={styles.column_1_3}>
            {props.nickname}
          </span>
          {/* TODO: Ian 2018-10-15 TBD in future ticket: pencil icon goes here? See #2428 */}
        </div>
      </PDListItem>
    </PDTitledList>
  )
}
