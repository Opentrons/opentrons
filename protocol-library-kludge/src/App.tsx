import * as React from 'react'
import { hot } from 'react-hot-loader/root'
import { URLDeck } from './URLDeck'
import './globals.css'

export function AppComponent(): JSX.Element {
  return <URLDeck />
}

export const App = hot(AppComponent)
