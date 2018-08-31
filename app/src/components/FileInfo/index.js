import * as React from 'react'
import InformationCard from './InformationCard'
import ProtocolPipettesCard from './ProtocolPipettesCard'
import ProtocolModulesCard from './ProtocolModulesCard'
import ProtocolLabwareCard from './ProtocolLabwareCard'
import Continue from './Continue'
import {CardContainer, CardRow} from '../layout'

export default function FileInfo (props) {
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
