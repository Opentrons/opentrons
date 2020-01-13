// @flow
import * as React from 'react'
import cx from 'classnames'
import { PDListItem } from '../lists'
import styles from './StepItem.css'

type Props = {|
  engage: boolean,
  labwareDisplayName: ?string,
  message?: ?string,
|}

export const MagnetStepItems = (props: Props) => (
  <>
    {props.message && <PDListItem>{props.message}</PDListItem>}
    {/* TODO IMMEDIATELY i18n here */}
    <li className={styles.aspirate_dispense}>
      <span>MAGNETIC MODULE</span>
      <span className={styles.spacer} />
      <span>ACTION</span>
    </li>
    <PDListItem
      className={cx(styles.step_subitem_column_header, styles.emphasized_cell)}
    >
      <span className={styles.labware_display_name}>
        {props.labwareDisplayName}
      </span>
      <span className={styles.step_subitem_spacer} />
      <span className={styles.labware_display_name}>
        {props.engage ? 'Engage' : 'Disengage'}
      </span>
    </PDListItem>
  </>
)
