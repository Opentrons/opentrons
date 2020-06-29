// @flow
// resources page layout
import * as React from 'react'

import { CardContainer, CardRow } from '../layout'
import { ResourceCard } from './ResourceCard'

export function Resources(): React.Node {
  return (
    <CardContainer>
      <CardRow>
        <ResourceCard
          title="Support Articles"
          description="Visit our walkthroughs and FAQs"
          url={'https://support.opentrons.com/ot-2'}
        />
      </CardRow>
      <CardRow>
        <ResourceCard
          title="Protocol Library"
          description="Download a protocol to run on your robot"
          url={'https://protocols.opentrons.com/'}
        />
      </CardRow>
      <CardRow>
        <ResourceCard
          title="Python Protocol API Documentation"
          description="Browse documentation for the OT-2 Python Protocol API"
          url={'https://docs.opentrons.com/'}
        />
      </CardRow>
    </CardContainer>
  )
}
