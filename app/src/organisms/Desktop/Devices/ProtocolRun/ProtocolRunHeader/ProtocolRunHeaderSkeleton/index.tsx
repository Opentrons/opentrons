import { Skeleton } from '/app/atoms/Skeleton'

import styles from './protocolrunheaderskeleton.module.css'

import type { JSX } from 'react'

export function ProtocolRunHeaderSkeleton(): JSX.Element {
  return (
    <div className={styles.skeleton} data-testid="ProtocolRunHeaderSkeleton">
      <Skeleton width="100%" height="14rem" backgroundSize="200%" />
    </div>
  )
}
