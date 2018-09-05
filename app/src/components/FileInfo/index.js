// @flow
import * as React from 'react'

import type {Robot} from '../../robot'

import InformationCard from './InformationCard'
import ProtocolPipettesCard from './ProtocolPipettesCard'
import ProtocolModulesCard from './ProtocolModulesCard'
import ProtocolLabwareCard from './ProtocolLabwareCard'
import Continue from './Continue'
import {CardContainer, CardRow} from '../layout'

type Props = {
  name: string,
  robot: Robot,
}

export default function FileInfo (props: Props) {
  return (
    <CardContainer>
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
    </CardContainer>
  )
}
