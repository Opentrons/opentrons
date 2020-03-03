// @flow
import * as React from 'react'
import cx from 'classnames'
import { HoverTooltip } from '@opentrons/components'
import { i18n } from '../../localization'
import { PDListItem } from '../lists'
import { Portal } from './TooltipPortal'
import { LabwareTooltipContents } from './LabwareTooltipContents'
import styles from './StepItem.css'
import type { ModuleRealType } from '@opentrons/shared-data'

type Props = {|
  action: string,
  moduleType: ModuleRealType,
  actionText: string,
  labwareDisplayName: ?string,
  labwareNickname: ?string,
  message?: ?string,
|}

export const ModuleStepItems = (props: Props) => (
  <>
    <li className={styles.substep_header}>
      <span>{i18n.t(`modules.module_long_names.${props.moduleType}`)}</span>
      <span>{props.action}</span>
    </li>
    <PDListItem
      className={cx(styles.step_subitem_column_header, styles.substep_content)}
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
      <span className={styles.module_substep_value}>{props.actionText}</span>
    </PDListItem>
    {props.message && (
      <PDListItem className={cx(styles.substep_content, 'step-item-message')}>
        &quot;{props.message}&quot;
      </PDListItem>
    )}
  </>
)
