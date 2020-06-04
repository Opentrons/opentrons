// @flow
// custom labware page
import * as React from 'react'
import type { ContextRouter } from 'react-router-dom'

import { Page } from '../../components/Page'
import { CardContainer, CardRow } from '../../components/layout'
import { AddLabwareCard } from '../../components/AddLabwareCard'
import { ListLabwareCard } from '../../components/ListLabwareCard'

// TODO(mc, 2019-10-17): i18n
const CUSTOM_LABWARE_PAGE_TITLE = 'Custom Labware'

export function CustomLabware(props: ContextRouter): React.Node {
  return (
    <Page titleBarProps={{ title: CUSTOM_LABWARE_PAGE_TITLE }}>
      <CardContainer>
        <CardRow>
          <AddLabwareCard />
        </CardRow>
        <CardRow>
          <ListLabwareCard />
        </CardRow>
      </CardContainer>
    </Page>
  )
}
