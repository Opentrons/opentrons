// @flow
// main application wrapper component
import * as React from 'react'
import {hot} from 'react-hot-loader/root'

import styles from './styles.css'

export function App () {
  return <h1 className={styles.title}>Opentrons Labware Library</h1>
}

export default hot(App)
