// @flow
import * as React from 'react'

import type {Robot} from '../../robot'

import InformationCard from './InformationCard'
import ProtocolPipettesCard from './ProtocolPipettesCard'
import ProtocolModulesCard from './ProtocolModulesCard'
import ProtocolLabwareCard from './ProtocolLabwareCard'
import Continue from './Continue'
import {CardRow} from '../layout'

import styles from './styles.css'

type Props = {
  name: string,
  robot: Robot,
}

export default function FileInfo (props: Props) {
  return (
    <div className={styles.file_info_container}>
      <CardRow>
        <InformationCard {...props}/>
      </CardRow>
      <CardRow>
        <ProtocolPipettesCard />
      </CardRow>
      <CardRow>
        <ProtocolModulesCard />
      </CardRow>
      <CardRow>
        <ProtocolLabwareCard />
      </CardRow>
      <CardRow>
        <Continue />
      </CardRow>
    </div>
  )
}
