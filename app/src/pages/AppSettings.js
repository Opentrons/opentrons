// @flow
// view info about the app and update
import React from 'react'
import Page from '../components/Page'
import AppInfo/*, {AppUpdateModal} */ from '../components/AppSettings'

export default function AppSettingsPage () {
  return (
    <Page>
      <AppInfo />
      {/* <AppUpdateModal /> */}
    </Page>
  )
}
