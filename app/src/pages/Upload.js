// @flow
import React from 'react'
import {Switch, Route, type Match} from 'react-router'
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
      <Switch>
        <Route exact path={`${path}/confirm`} component={UploadAlert} />
      </Switch>
    </Page>
  )
}
