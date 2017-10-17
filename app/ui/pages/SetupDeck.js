// setup instruments component
import React from 'react'
import {Route} from 'react-router'
import Header from '../components/Header'
import Page from '../components/Page'
import ConnectedDeckConfig from '../containers/ConnectedDeckConfig'
import ConnectedJogModal from '../containers/ConnectedJogModal'

export default function SetupDeckPage (props) {
  const {match: {url}, match: {params}} = props
  const slot = parseInt(params.slot) || 1

  return (
    <Page>
      <Header />
      <ConnectedDeckConfig slot={slot} />
      <Route path={`${url}/jog`} component={ConnectedJogModal} />
    </Page>
  )
}
