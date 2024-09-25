import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'
import {
  LegacyTooltip,
  useHoverTooltip,
  TOOLTIP_FIXED,
} from '@opentrons/components'
import { PDListItem } from '../lists'
import { LabwareTooltipContents } from './LabwareTooltipContents'
import styles from './StepItem.module.css'
import type { UseHoverTooltipTargetProps } from '@opentrons/components'
import type { ModuleType } from '@opentrons/shared-data'

export interface ModuleStepItemRowProps {
  label?: string | null
  value?: string | null
  targetProps?: UseHoverTooltipTargetProps
}

export const ModuleStepItemRow = (
  props: ModuleStepItemRowProps
): JSX.Element => (
  <PDListItem
    className={cx(styles.step_subitem_column_header, styles.substep_content)}
  >
    <span {...props.targetProps} className={styles.labware_display_name}>
      {props.label}
    </span>
    <span className={styles.module_substep_value}>{props.value}</span>
  </PDListItem>
)

interface ModuleStepItemsProps {
  moduleType: ModuleType
  actionText: string
  moduleSlot?: string
  action?: string
  children?: React.ReactNode
  hideHeader?: boolean
  labwareNickname?: string | null
  message?: string | null
}

export function ModuleStepItems(props: ModuleStepItemsProps): JSX.Element {
  const {
    moduleType,
    actionText,
    moduleSlot,
    action,
    hideHeader,
    labwareNickname,
    children,
    message,
  } = props
  const { t } = useTranslation(['modules', 'application'])
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'bottom-start',
    strategy: TOOLTIP_FIXED,
  })
  const moduleLongName = t(`module_long_names.${moduleType}`)

  return (
    <>
      {!Boolean(hideHeader) ? (
        <li className={styles.substep_header}>
          <span>
            {moduleSlot != null
              ? t('application:module_and_slot', {
                  moduleLongName,
                  slotName: moduleSlot,
                })
              : moduleLongName}
          </span>
          <span>{action}</span>
        </li>
      ) : null}
      <LegacyTooltip {...tooltipProps}>
        <LabwareTooltipContents labwareNickname={labwareNickname} />
      </LegacyTooltip>
      <ModuleStepItemRow
        label={labwareNickname}
        targetProps={targetProps}
        value={actionText}
      />
      {children}
      {message != null ? (
        <PDListItem className={cx(styles.substep_content, 'step-item-message')}>
          &quot;{message}&quot;
        </PDListItem>
      ) : null}
    </>
  )
}
