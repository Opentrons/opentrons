import * as React from 'react'
import InformationCard from './InformationCard'
import {CardContainer, CardRow} from '../layout'

export default function FileInfo (props) {
  return (
    <CardContainer>
      <CardRow>
        <InformationCard {...props}/>
      </CardRow>
    </CardContainer>
  )
}
