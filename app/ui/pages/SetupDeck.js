// setup instruments component
import React from 'react'
import {Route} from 'react-router'
import Header from '../components/Header'
import Page from '../components/Page'
import ConnectedDeckConfig from '../containers/ConnectedDeckConfig'
import ConnectedJogModal from '../containers/ConnectedJogModal'

export default function SetupDeckPage (props) {
  const {match: {url}} = props

  return (
    <Page>
      <Header />
      <ConnectedDeckConfig />
      <Route path={`${url}/jog`} component={ConnectedJogModal} />
    </Page>
  )
}
