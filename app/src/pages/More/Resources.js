// @flow
import React from 'react'
import { Page } from '../../components/Page'
import { Resources as ResourcesContents } from '../../components/Resources'

export function Resources() {
  return (
    <Page titleBarProps={{ title: 'Resources' }}>
      <ResourcesContents />
    </Page>
  )
}
