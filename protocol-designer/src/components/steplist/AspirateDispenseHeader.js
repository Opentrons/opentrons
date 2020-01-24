// @flow
import * as React from 'react'
import cx from 'classnames'
import { Icon, HoverTooltip } from '@opentrons/components'
import { PDListItem } from '../lists'
import styles from './StepItem.css'
import { LabwareTooltipContents } from './LabwareTooltipContents'
import { Portal } from './TooltipPortal'

type AspirateDispenseHeaderProps = {
  sourceLabwareNickname: ?string,
  sourceLabwareDefDisplayName: ?string,
  destLabwareNickname: ?string,
  destLabwareDefDisplayName: ?string,
}

export function AspirateDispenseHeader(props: AspirateDispenseHeaderProps) {
  const {
    sourceLabwareNickname,
    sourceLabwareDefDisplayName,
    destLabwareNickname,
    destLabwareDefDisplayName,
  } = props

  return (
    <React.Fragment>
      <li className={styles.aspirate_dispense}>
        <span>ASPIRATE</span>
        <span className={styles.spacer} />
        <span>DISPENSE</span>
      </li>

      <PDListItem
        className={cx(
          styles.step_subitem_column_header,
          styles.emphasized_cell
        )}
      >
        <HoverTooltip
          portal={Portal}
          tooltipComponent={
            <LabwareTooltipContents
              labwareNickname={sourceLabwareNickname}
              labwareDefDisplayName={sourceLabwareDefDisplayName}
            />
          }
        >
          {hoverTooltipHandlers => (
            <span
              {...hoverTooltipHandlers}
              className={styles.labware_display_name}
            >
              {sourceLabwareNickname}
            </span>
          )}
        </HoverTooltip>
        {/* This is always a "transfer icon" (arrow pointing right) for any step: */}
        <Icon className={styles.step_subitem_spacer} name="ot-transfer" />
        <HoverTooltip
          portal={Portal}
          tooltipComponent={
            <LabwareTooltipContents
              labwareNickname={destLabwareNickname}
              labwareDefDisplayName={destLabwareDefDisplayName}
            />
          }
        >
          {hoverTooltipHandlers => (
            <span
              {...hoverTooltipHandlers}
              className={styles.labware_display_name}
            >
              {destLabwareNickname}
            </span>
          )}
        </HoverTooltip>
      </PDListItem>
    </React.Fragment>
  )
}
