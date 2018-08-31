// @flow
import * as React from 'react'
import {Card, LabeledValue} from '@opentrons/components'
import {CardContentHalf} from '../layout'

import styles from './styles.css'

type Props = {
  name: string
}
const TITLE = 'Information'

export default function InformationCard (props: Props) {
  const {name} = props

  let createdBy = 'Opentrons API'
  if (name.includes('json')) {
    createdBy = 'Protocol Designer'
  }

  return (
    <Card title={TITLE}>
      <CardContentHalf>
        <LabeledValue label={'Protocol Name'} value={name} />
      </CardContentHalf>
      <CardContentHalf className={styles.align_left}>
        <LabeledValue label={'Creation Method'} value={createdBy} />
      </CardContentHalf>
    </Card>
  )
}
