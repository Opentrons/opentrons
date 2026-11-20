import styles from './holiday.module.css'

import { useCallback, useRef, type ReactNode } from 'react'
import { Snowflakes } from './Snowflakes'
import { useCurrentRunId } from '/app/resources/runs'
import { useRunControls } from '/app/organisms/RunTimeControl'

export function StartScreen(): ReactNode {

    
    const runId = useCurrentRunId()
    const {play} = useRunControls(runId)

    
  return (
    <div className={styles.background} onClick={play}>
      <h1 className={styles.startscreen_title}>Otie's Gripper Madness</h1>
      <p className={styles.startscreen_subtitle}>Tap to start...</p>
      <Snowflakes count={100} />
    </div>
  )
}
