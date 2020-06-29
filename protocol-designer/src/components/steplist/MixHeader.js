// @flow
import { Tooltip, TOOLTIP_FIXED, useHoverTooltip } from '@opentrons/components'
import cx from 'classnames'
import * as React from 'react'

import { PDListItem } from '../lists'
import { LabwareTooltipContents } from './LabwareTooltipContents'
import styles from './StepItem.css'

type Props = {
  volume: ?string,
  times: ?string,
  labwareNickname: ?string,
  labwareDefDisplayName: ?string,
}

export function MixHeader(props: Props): React.Node {
  const { volume, times, labwareNickname, labwareDefDisplayName } = props
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'bottom-start',
    strategy: TOOLTIP_FIXED,
  })
  return (
    <>
      <Tooltip {...tooltipProps}>
        <LabwareTooltipContents
          {...{ labwareNickname, labwareDefDisplayName }}
        />
      </Tooltip>

      <PDListItem className={styles.step_subitem}>
        <span
          {...targetProps}
          className={cx(styles.emphasized_cell, styles.labware_display_name)}
        >
          {labwareNickname}
        </span>

        <span>{volume} uL</span>
        <span>{times}x</span>
      </PDListItem>
    </>
  )
}
