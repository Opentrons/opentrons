// @flow
import * as React from 'react'
import { Page } from '../../atoms/Page'
import { Resources as ResourcesContents } from './Resources'

export function Resources(): React.Node {
  return (
    <Page titleBarProps={{ title: 'Resources' }}>
      <ResourcesContents />
    </Page>
  )
}
