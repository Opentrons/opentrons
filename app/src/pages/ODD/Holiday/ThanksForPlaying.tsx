import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { useCloneRun } from '/app/resources/runs'

import styles from './holiday.module.css'
import { Snowflakes } from './Snowflakes'

import type { ReactNode } from 'react'
import type { OnDeviceRouteParams } from '/app/App/types'

export function ThanksForPlaying(): ReactNode {
  const { runId } = useParams<
    keyof OnDeviceRouteParams
  >() as OnDeviceRouteParams
  const { cloneRun } = useCloneRun(runId)

  useEffect(() => {
    const interval = setInterval(() => {
      cloneRun()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={styles.background}>
      <p className={styles.instructions}>Thanks for playing!</p>
      <Snowflakes count={100} />
    </div>
  )
}
