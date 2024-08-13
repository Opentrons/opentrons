import * as React from 'react'
import cx from 'classnames'
import {
  Icon,
  SharedTooltip,
  useHoverTooltip,
  TOOLTIP_FIXED,
} from '@opentrons/components'
import { PDListItem } from '../lists'
import styles from './StepItem.module.css'
import { LabwareTooltipContents } from './LabwareTooltipContents'

interface AspirateDispenseHeaderProps {
  sourceLabwareNickname?: string | null
  destLabwareNickname?: string | null
}

export function AspirateDispenseHeader(
  props: AspirateDispenseHeaderProps
): JSX.Element {
  const { sourceLabwareNickname, destLabwareNickname } = props

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

      <SharedTooltip {...sourceTooltipProps}>
        <LabwareTooltipContents labwareNickname={sourceLabwareNickname} />
      </SharedTooltip>

      <SharedTooltip {...destTooltipProps}>
        <LabwareTooltipContents labwareNickname={destLabwareNickname} />
      </SharedTooltip>

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
