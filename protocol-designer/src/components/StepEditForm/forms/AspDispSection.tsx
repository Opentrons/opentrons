import * as React from 'react'
import { IconButton, Tooltip, useHoverTooltip } from '@opentrons/components'
import { i18n } from '../../../localization'
import styles from '../StepEditForm.module.css'

interface Props {
  className?: string | null
  collapsed?: boolean | null
  toggleCollapsed: () => void
  prefix: 'aspirate' | 'dispense'
  children?: React.ReactNode
}

export const AspDispSection = (props: Props): JSX.Element => {
  const { children, className, collapsed, toggleCollapsed, prefix } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  return (
    // @ts-expect-error(sa, 2021-7-2): className might be null
    <div className={className}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>{prefix}</span>
        <Tooltip
          {...tooltipProps}
          key={collapsed ? 'collapsed' : 'expanded'} // NOTE: without this key, the IconButton will not re-render unless clicked
        >
          {i18n.t('tooltip.advanced_settings')}
        </Tooltip>
        <div
          {...targetProps}
          onClick={toggleCollapsed}
          className={styles.advanced_settings_button_wrapper}
        >
          <IconButton
            className={styles.advanced_settings_button}
            id={`AspDispSection_settings_button_${props.prefix}`}
            name="settings"
            hover={!collapsed}
          />
        </div>
      </div>
      {children}
    </div>
  )
}
