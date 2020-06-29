// @flow
// TODO(mc, 2020-02-19): no longer used; remove
import * as React from 'react'

import { CenteredTextSvg } from './CenteredTextSvg'
import type { LabwareWrapperProps } from './LabwareWrapper'
import { LabwareWrapper } from './LabwareWrapper'
import styles from './LabwareWrapper.css'

export type EmptyDeckSlotProps = {|
  ...LabwareWrapperProps,
  slot: string,
|}

/**
 * @deprecated Use {@link RobotWorkSpace}
 */
export function EmptyDeckSlot(props: EmptyDeckSlotProps): React.Node {
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
