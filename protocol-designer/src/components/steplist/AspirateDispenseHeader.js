// @flow
import * as React from 'react'
import cx from 'classnames'
import {Icon, HoverTooltip} from '@opentrons/components'
import {PDListItem} from '../lists'
import styles from './StepItem.css'
import LabwareTooltipContents from './LabwareTooltipContents'
import type {Labware} from '../../labware-ingred/types'
import {labwareToDisplayName} from '../../labware-ingred/utils'
import {Portal} from './TooltipPortal'

type AspirateDispenseHeaderProps = {
  sourceLabware: ?Labware,
  destLabware: ?Labware,
}

function AspirateDispenseHeader (props: AspirateDispenseHeaderProps) {
  const {sourceLabware, destLabware} = props

  return (
    <React.Fragment>
      <li className={styles.aspirate_dispense}>
        <span>ASPIRATE</span>
        <span className={styles.spacer}/>
        <span>DISPENSE</span>
      </li>

      <PDListItem className={cx(styles.step_subitem_column_header, styles.emphasized_cell)}>
        <HoverTooltip
          portal={Portal}
          tooltipComponent={<LabwareTooltipContents labware={sourceLabware} />}>
          {(hoverTooltipHandlers) => (
            <span {...hoverTooltipHandlers} className={styles.labware_display_name}>
              {sourceLabware && labwareToDisplayName(sourceLabware)}
            </span>
          )}
        </HoverTooltip>
        {/* This is always a "transfer icon" (arrow pointing right) for any step: */}
        <Icon name='ot-transfer' />
        <HoverTooltip
          portal={Portal}
          tooltipComponent={<LabwareTooltipContents labware={destLabware} />}>
          {(hoverTooltipHandlers) => (
            <span {...hoverTooltipHandlers} className={styles.labware_display_name}>
              {destLabware && labwareToDisplayName(destLabware)}
            </span>
          )}
        </HoverTooltip>
      </PDListItem>
    </React.Fragment>
  )
}

export default AspirateDispenseHeader
