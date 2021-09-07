// resources page layout
import * as React from 'react'
import { Page } from '../../../atoms/Page'
import { ResourceCard } from './ResourceCard'
import { CardContainer, CardRow } from '../../../atoms/layout'

export function Resources(): JSX.Element {
  return (
    <Page titleBarProps={{ title: 'Resources' }}>
      <CardContainer>
        <CardRow>
          <ResourceCard
            title="Support Articles"
            description="Visit our walkthroughs and FAQs"
            url={'https://support.opentrons.com/'}
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
    </Page>
  )
}
