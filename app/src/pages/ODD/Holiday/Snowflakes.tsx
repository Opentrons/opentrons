import { ReactNode } from 'react'

import styles from './holiday.module.css'

export function Snowflake(): ReactNode {
  return <div className={styles.snowflake} />
}

export function Snowflakes({ count }: { count: number }): ReactNode {
  return (
    <div className={styles.snowflakes}>
      {Array.from({ length: count }).map((_, index) => (
        <Snowflake key={index} />
      ))}
    </div>
  )
}
