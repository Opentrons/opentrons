// @flow
// main application wrapper component
import * as React from 'react'
import {hot} from 'react-hot-loader/root'

import Nav from '../Nav'
import LazyPage from './LazyPage'
import styles from './styles.css'

import type {ContextRouter} from 'react-router-dom'

export function App (props: ContextRouter) {
  return (
    <div className={styles.app}>
      <Nav />
      <LazyPage location={props.location} />
    </div>
  )
}

export default hot(App)
