// @flow
import * as React from 'react'
import { PDListItem } from '../lists'
import styles from './styles.css'

type Props = {
  selectLabware: (containerType: string) => mixed,
  containerType: string,
  displayName: string,
  onMouseOver: () => any,
}

export default function LabwareItem(props: Props) {
  const { selectLabware, onMouseOver, containerType, displayName } = props
  return (
    <PDListItem
      border
      hoverable
      className={styles.labware_list_item}
      onClick={() => selectLabware(containerType)}
      onMouseOver={onMouseOver}
    >
      {displayName}
    </PDListItem>
  )
}
