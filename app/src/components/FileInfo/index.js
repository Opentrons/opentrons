import * as React from 'react'
import InformationCard from './InformationCard'
import ProtocolPipettesCard from './ProtocolPipettesCard'
import ProtocolModulesCard from './ProtocolModulesCard'
import ProtocolLabwareCard from './ProtocolLabwareCard'
import ContinueButtonGroup from './ContinueButtonGroup'
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
        <ContinueButtonGroup />
      </CardRow>
    </CardContainer>
  )
}
