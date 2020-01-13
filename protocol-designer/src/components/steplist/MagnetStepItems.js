// @flow
import * as React from 'react'
import cx from 'classnames'
import { HoverTooltip } from '@opentrons/components'
import { PDListItem } from '../lists'
import { Portal } from './TooltipPortal'
import LabwareTooltipContents from './LabwareTooltipContents'
import styles from './StepItem.css'

type Props = {|
  engage: boolean,
  labwareDisplayName: ?string,
  labwareNickname: ?string,
  message?: ?string,
|}

export const MagnetStepItems = (props: Props) => (
  <>
    {props.message && <PDListItem>{props.message}</PDListItem>}
    {/* TODO IMMEDIATELY i18n here */}
    <li className={styles.aspirate_dispense}>
      <span>MAGNETIC MODULE</span>
      <span className={styles.spacer} />
      <span>ACTION</span>
    </li>
    <PDListItem
      className={cx(styles.step_subitem_column_header, styles.emphasized_cell)}
    >
      <HoverTooltip
        portal={Portal}
        tooltipComponent={
          <LabwareTooltipContents
            labwareNickname={props.labwareNickname}
            labwareDefDisplayName={props.labwareDisplayName}
          />
        }
      >
        {hoverTooltipHandlers => (
          <span
            {...hoverTooltipHandlers}
            className={styles.labware_display_name}
          >
            {props.labwareNickname}
          </span>
        )}
      </HoverTooltip>
      <span className={styles.step_subitem_spacer} />
      <span className={styles.labware_display_name}>
        {props.engage ? 'Engage' : 'Disengage'}
      </span>
    </PDListItem>
  </>
)
