import styles from './holiday.module.css'
import { Snowflakes } from './Snowflakes'

import type { ReactNode } from 'react'

export function Loading(): ReactNode {
  return (
    <div className={styles.background}>
      <h1 className={styles.loading_title}>Loading...</h1>
      <Snowflakes count={100} />
    </div>
  )
}
