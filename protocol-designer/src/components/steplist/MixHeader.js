// @flow
import * as React from 'react'
import cx from 'classnames'
import {HoverTooltip} from '@opentrons/components'
import {PDListItem} from '../lists'
import styles from './StepItem.css'
import LabwareTooltipContents from './LabwareTooltipContents'
import {Portal} from './TooltipPortal'

type Props = {
  volume: ?string,
  times: ?string,
  labwareNickname: ?string,
  labwareType: ?string,
}

export default function MixHeader (props: Props) {
  const {volume, times, labwareNickname, labwareType} = props
  return (
    <PDListItem className={styles.step_subitem}>
      <HoverTooltip
        portal={Portal}
        tooltipComponent={<LabwareTooltipContents {...{labwareNickname, labwareType}} />}>
        {(hoverTooltipHandlers) => (
          <span {...hoverTooltipHandlers} className={cx(styles.emphasized_cell, styles.labware_display_name)}>
            {labwareNickname}
          </span>
        )}
      </HoverTooltip>
      <span>{volume} uL</span>
      <span>{times}x</span>
    </PDListItem>
  )
}
