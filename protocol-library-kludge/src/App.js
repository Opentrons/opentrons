// @flow
import './globals.css'

import * as React from 'react'
import { hot } from 'react-hot-loader/root'

import { URLDeck } from './URLDeck'

export function AppComponent(): React.Node {
  return <URLDeck />
}

export const App: React.AbstractComponent<{||}> = hot(AppComponent)
