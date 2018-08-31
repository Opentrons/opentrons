// @flow
import * as React from 'react'
import {LabeledValue} from '@opentrons/components'
import InfoSection from './InfoSection'
import {SectionContentHalf} from '../layout'

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
    <InfoSection title={TITLE}>
      <SectionContentHalf>
        <LabeledValue label={'Protocol Name'} value={name} />
      </SectionContentHalf>
      <SectionContentHalf className={styles.align_left}>
        <LabeledValue label={'Creation Method'} value={createdBy} />
      </SectionContentHalf>
    </InfoSection>
  )
}
