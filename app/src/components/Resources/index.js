// @flow
// resources page layout
import * as React from 'react'

import ResourceCard from './ResourceCard'
import {CardContainer, CardRow} from '../layout'

export default function Resources () {
  return (
    <CardContainer>
      <CardRow>
        <ResourceCard
          title='Support Articles'
          description='Visit our walkthroughs and FAQs'
          url={'https://support.opentrons.com/ot-2'}
        />
      </CardRow>
      <CardRow>
        <ResourceCard
          title='Protocol Library'
          description='Download a protocol to run on your robot'
          url={'https://protocols.opentrons.com/'}
        />
      </CardRow>
    </CardContainer>
  )
}
