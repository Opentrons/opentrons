// @flow
// "no results" message if filters hide all labware
import * as React from 'react'

import styles from './styles.css'

// TODO(mc, 2019-04-05): i18n
const EN_NO_RESULTS = 'No results found'

export function NoResults() {
  return <p className={styles.no_results}>{EN_NO_RESULTS}</p>
}
