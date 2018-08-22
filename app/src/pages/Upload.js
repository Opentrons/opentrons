// @flow
import React from 'react'
import {Route, type Match} from 'react-router'
import UploadStatus from '../components/UploadStatus'
import UploadAlert from '../components/UploadAlert'
import Page from '../components/Page'

type Props = {
  match: Match
}

export default function UploadPage (props: Props) {
  const {match: {path}} = props
  return (
    <Page>
      <UploadStatus />
      <Route exact path={`${path}/confirm`} component={UploadAlert} />
    </Page>
  )
}
