// @flow
import * as React from 'react'
import cx from 'classnames'
import {Icon, HoverTooltip} from '@opentrons/components'
import {PDListItem} from '../lists'
import styles from './StepItem.css'
import type {Labware} from '../../'

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
        <HoverTooltip tooltipComponent={<LabwareTooltipContents name={sourceLabware.name} type={sourceLabware.type} />}>
          {(hoverTooltipHandlers) => <span {...hoverTooltipHandlers}>{sourceLabware.name}</span>}
        </HoverTooltip>
        {/* This is always a "transfer icon" (arrow pointing right) for any step: */}
        <Icon name='ot-transfer' />
        <HoverTooltip tooltipComponent={<LabwareTooltipContents name={destLabware.name} type={destLabware.type}/>}>
          {(hoverTooltipHandlers) => <span {...hoverTooltipHandlers}>{destLabware.name}</span>}
        </HoverTooltip>
      </PDListItem>
    </React.Fragment>
  )
}
type LabwareTooltipContentsProps = {name: ?string, type: ?string}
const LabwareTooltipContents = ({name, type}: LabwareTooltipContentsProps) => (
  <div>
    {name}
    {type}
  </div>
)


export default AspirateDispenseHeader
