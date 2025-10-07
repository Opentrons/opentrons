import styles from './resizebar.module.css'

import type { MouseEvent } from 'react'

interface ResizeBarProps {
  handleMouseDown: (e: MouseEvent<HTMLDivElement>) => void
}

export function ResizeBar({ handleMouseDown }: ResizeBarProps): JSX.Element {
  return (
    <div className={styles.resize_bar} onMouseDown={handleMouseDown}>
      <div className={styles.handle}>
        <div className={styles.grip_line} />
        <div className={styles.grip_line} />
      </div>
    </div>
  )
}
