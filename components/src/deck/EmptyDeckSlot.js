// @flow
// TODO(mc, 2020-02-19): no longer used; remove
import * as React from 'react'

import { CenteredTextSvg } from './CenteredTextSvg'
import { LabwareWrapper } from './LabwareWrapper'
import styles from './LabwareWrapper.css'

import type { LabwareWrapperProps } from './LabwareWrapper'

export type EmptyDeckSlotProps = {|
  ...LabwareWrapperProps,
  slot: string,
|}

export function EmptyDeckSlot(props: EmptyDeckSlotProps) {
  const { slot, ...labwareWrapperProps } = props

  return (
    <LabwareWrapper {...labwareWrapperProps}>
      <g className={styles.empty_slot}>
        <rect width="100%" height="100%" />
        <CenteredTextSvg text={slot} />
      </g>
    </LabwareWrapper>
  )
}
