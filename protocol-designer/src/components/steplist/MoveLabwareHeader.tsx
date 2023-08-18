import * as React from 'react'
import cx from 'classnames'
import { Tooltip, useHoverTooltip, TOOLTIP_FIXED } from '@opentrons/components'
import { PDListItem } from '../lists'
import { LabwareTooltipContents } from './LabwareTooltipContents'

import styles from './StepItem.css'

interface MoveLabwareHeaderProps {
  sourceLabwareNickname?: string | null
  destinationSlot?: string | null
  useGripper: boolean
}

//  TODO(jr, 7/31/23): add text to i18n
export function MoveLabwareHeader(props: MoveLabwareHeaderProps): JSX.Element {
  const { sourceLabwareNickname, destinationSlot, useGripper } = props

  const [sourceTargetProps, sourceTooltipProps] = useHoverTooltip({
    placement: 'bottom-start',
    strategy: TOOLTIP_FIXED,
  })

  const [destTargetProps, destTooltipProps] = useHoverTooltip({
    placement: 'bottom',
    strategy: TOOLTIP_FIXED,
  })

  const destSlot = destinationSlot === 'offDeck' ? 'off deck' : destinationSlot
  return (
    <>
      <li className={styles.substep_header}>
        <span>{useGripper ? 'With gripper' : 'Manually'} </span>
      </li>
      <li className={styles.substep_header}>
        <span>LABWARE</span>
        <span className={styles.spacer} />
        <span>DESTINATION SLOT</span>
      </li>

      <Tooltip {...sourceTooltipProps}>
        <LabwareTooltipContents labwareNickname={sourceLabwareNickname} />
      </Tooltip>

      <Tooltip {...destTooltipProps}>
        <LabwareTooltipContents labwareNickname={destinationSlot} />
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

        <div className={styles.spacer} />
        <span {...destTargetProps} className={styles.labware_display_name}>
          {destSlot}
        </span>
      </PDListItem>
    </>
  )
}
