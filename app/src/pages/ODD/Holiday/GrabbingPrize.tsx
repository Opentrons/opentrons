import styles from './holiday.module.css'
import { Snowflakes } from './Snowflakes'

import type { ReactNode } from 'react'

export function GrabbingPrize(): ReactNode {
  return (
    <div className={styles.background}>
      <p className={styles.instructions}>Grabbing your prize! Good luck!</p>
      <Snowflakes count={100} />
    </div>
  )
}
