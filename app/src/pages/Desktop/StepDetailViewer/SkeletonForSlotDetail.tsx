import { BORDERS } from '@opentrons/components'

import { Skeleton } from '/app/atoms/Skeleton'

import styles from './skeletonforslotdetail.module.css'

import type { ReactNode } from 'react'

// backgroundSize 23px + 360px from the default design size
export function SkeletonForSlotDetail(): ReactNode {
  return (
    <div className={styles.slot_loading_container}>
      <div className={styles.slot_loading_header}>
        <Skeleton
          width="23px"
          height="20px"
          borderRadius={BORDERS.borderRadius4}
          backgroundSize="24rem"
        />
      </div>
      <div className={styles.slot_loading_body}>
        <Skeleton
          width="100%"
          height="100%"
          backgroundSize="24rem"
          borderRadius={BORDERS.borderRadius4}
        />
      </div>
    </div>
  )
}
