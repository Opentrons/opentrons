// @flow
import * as React from 'react'
import {Labware} from '@opentrons/components'
import SingleLabware from '../../SingleLabware'
import styles from './NewFileModal.css'

type Props = {containerType: ?string}

export default function TiprackDiagram (props: Props) {
  const {containerType} = props
  if (!containerType) {
    return <div className={styles.tiprack_labware} />
  }

  return (
    <SingleLabware className={styles.tiprack_labware}>
      <Labware labwareType={containerType} />
    </SingleLabware>
  )
}
