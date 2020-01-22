// @flow
import React from 'react'
import Page from '../../components/Page'
import { Resources } from '../../components/Resources'

export function ResourcesPage() {
  return (
    <Page titleBarProps={{ title: 'Resources' }}>
      <Resources />
    </Page>
  )
}
