// custom labware page
import * as React from 'react'

import { Page } from '../../atoms/Page'
import { CardContainer, CardRow } from '../../atoms/layout'
import { AddLabwareCard } from './AddLabwareCard'
import { ListLabwareCard } from './ListLabwareCard'

import type { RouteComponentProps } from 'react-router-dom'

// TODO(mc, 2019-10-17): i18n
const CUSTOM_LABWARE_PAGE_TITLE = 'Custom Labware'

export function CustomLabware(props: RouteComponentProps): JSX.Element {
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
