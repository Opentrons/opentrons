import * as React from 'react'
import { hot } from 'react-hot-loader/root'

import './globals.css'
import { URLDeck } from './URLDeck'

export function AppComponent(): JSX.Element {
  return <URLDeck />
}

export const App = hot(AppComponent)
