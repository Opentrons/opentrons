// @flow
import * as React from 'react'
import cx from 'classnames'
import {HoverTooltip} from '@opentrons/components'
import {PDListItem} from '../lists'
import styles from './StepItem.css'
import type {Labware} from '../../labware-ingred/types'
import LabwareTooltipContents from './LabwareTooltipContents'
import {Portal} from './TooltipPortal'

type Props = {
  volume: ?string,
  times: ?string,
  labware: ?Labware,
}

export default function MixHeader (props: Props) {
  const {volume, times, labware} = props
  return (
    <PDListItem className={styles.step_subitem}>
      <HoverTooltip
        portal={Portal}
        tooltipComponent={<LabwareTooltipContents labware={labware} />}>
        {(hoverTooltipHandlers) => (
          <span {...hoverTooltipHandlers} className={cx(styles.emphasized_cell, styles.labware_display_name)}>
            {labware && labware.name}
          </span>
        )}
      </HoverTooltip>
      <span>{volume} uL</span>
      <span>{times}x</span>
    </PDListItem>
  )
}
