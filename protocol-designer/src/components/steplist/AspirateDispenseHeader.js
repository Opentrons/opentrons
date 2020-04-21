// @flow
import * as React from 'react'
import cx from 'classnames'
import {
  Icon,
  Tooltip,
  useHoverTooltip,
  TOOLTIP_FIXED,
} from '@opentrons/components'
import { PDListItem } from '../lists'
import styles from './StepItem.css'
import { LabwareTooltipContents } from './LabwareTooltipContents'

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

  const [sourceTargetProps, sourceTooltipProps] = useHoverTooltip({
    placement: 'bottom-start',
    strategy: TOOLTIP_FIXED,
  })

  const [destTargetProps, destTooltipProps] = useHoverTooltip({
    placement: 'bottom',
    strategy: TOOLTIP_FIXED,
  })

  return (
    <>
      <li className={styles.aspirate_dispense}>
        <span>ASPIRATE</span>
        <span className={styles.spacer} />
        <span>DISPENSE</span>
      </li>

      <Tooltip {...sourceTooltipProps}>
        <LabwareTooltipContents
          labwareNickname={sourceLabwareNickname}
          labwareDefDisplayName={sourceLabwareDefDisplayName}
        />
      </Tooltip>

      <Tooltip {...destTooltipProps}>
        <LabwareTooltipContents
          labwareNickname={destLabwareNickname}
          labwareDefDisplayName={destLabwareDefDisplayName}
        />
      </Tooltip>

      <PDListItem
        className={cx(
          styles.step_subitem_column_header,
          styles.emphasized_cell
        )}
      >
        <span {...sourceTargetProps} className={styles.labware_display_name}>
          {sourceLabwareNickname}
        </span>

        {/* This is always a "transfer icon" (arrow pointing right) for any step: */}
        <Icon className={styles.step_subitem_spacer} name="ot-transfer" />

        <span {...destTargetProps} className={styles.labware_display_name}>
          {destLabwareNickname}
        </span>
      </PDListItem>
    </>
  )
}
