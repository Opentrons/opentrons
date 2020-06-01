// @flow
import * as React from 'react'
import { Page } from '../../components/Page'
import { Resources as ResourcesContents } from '../../components/Resources'

export function Resources(): React.Node {
  return (
    <Page titleBarProps={{ title: 'Resources' }}>
      <ResourcesContents />
    </Page>
  )
}
