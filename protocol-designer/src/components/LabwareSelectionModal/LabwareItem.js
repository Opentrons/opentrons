// @flow
import * as React from 'react'
import {PDListItem} from '../lists'
import styles from './styles.css'

type Props = {
  selectLabware: (containerType: string) => mixed,
  containerType: string,
  displayName: string,
  labwareImgUrl?: ?string,
}

export default function LabwareItem (props: Props) {
  const {selectLabware, containerType, labwareImgUrl, displayName} = props
  return (
    <PDListItem
      border
      hoverable
      className={styles.labware_list_item}
      onClick={() => selectLabware(containerType)}
      style={labwareImgUrl ? {'--image-url': `url(${labwareImgUrl})`} : {}}
    >
      {displayName}
    </PDListItem>
  )
}
