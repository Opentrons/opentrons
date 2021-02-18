// @flow
import * as React from 'react'
// import useSelector from 'react-redux'
import { DeckSetup } from './DeckSetup'

export const DeckSetupManager = (): React.Node => {
  // TODO IMMEDIATELY: use `getMultiSelectMode` selector to branch btw deck setup vs batch edit bkg panel
  return <DeckSetup />
}
