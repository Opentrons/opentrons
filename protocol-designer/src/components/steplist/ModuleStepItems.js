// @flow
import * as React from 'react'
import cx from 'classnames'
import {
  Tooltip,
  useHoverTooltip,
  TOOLTIP_FIXED,
  type UseHoverTooltipTargetProps,
} from '@opentrons/components'
import type { ModuleRealType } from '@opentrons/shared-data'
import { i18n } from '../../localization'
import { PDListItem } from '../lists'
import { LabwareTooltipContents } from './LabwareTooltipContents'
import styles from './StepItem.css'

export type ModuleStepItemRowProps = {|
  label?: ?string,
  value?: ?string,
  targetProps?: UseHoverTooltipTargetProps,
|}

export const ModuleStepItemRow = (
  props: ModuleStepItemRowProps
): React.Node => (
  <PDListItem
    className={cx(styles.step_subitem_column_header, styles.substep_content)}
  >
    <span {...props.targetProps} className={styles.labware_display_name}>
      {props.label}
    </span>
    <span className={styles.module_substep_value}>{props.value}</span>
  </PDListItem>
)

type Props = {|
  action?: string,
  moduleType: ModuleRealType,
  actionText: string,
  labwareDisplayName: ?string,
  labwareNickname: ?string,
  message?: ?string,
  children?: React.Node,
  hideHeader?: boolean,
|}

export const ModuleStepItems = (props: Props): React.Node => {
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'bottom-start',
    strategy: TOOLTIP_FIXED,
  })
  return (
    <>
      {!props.hideHeader && (
        <li className={styles.substep_header}>
          <span>{i18n.t(`modules.module_long_names.${props.moduleType}`)}</span>
          <span>{props.action}</span>
        </li>
      )}
      <Tooltip {...tooltipProps}>
        <LabwareTooltipContents
          labwareNickname={props.labwareNickname}
          labwareDefDisplayName={props.labwareDisplayName}
        />
      </Tooltip>
      <ModuleStepItemRow
        label={props.labwareNickname}
        targetProps={targetProps}
        value={props.actionText}
      />
      {props.children}
      {props.message && (
        <PDListItem className={cx(styles.substep_content, 'step-item-message')}>
          &quot;{props.message}&quot;
        </PDListItem>
      )}
    </>
  )
}
