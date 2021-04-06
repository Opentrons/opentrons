// @flow
import * as React from 'react'
import { IconButton, Tooltip, useHoverTooltip } from '@opentrons/components'
import { i18n } from '../../../localization'
import styles from '../StepEditForm.css'

type Props = {
  className?: ?string,
  collapsed?: ?boolean,
  toggleCollapsed: () => void,
  prefix: 'aspirate' | 'dispense',
  children?: React.Node,
}

export const AspDispSection = (props: Props): React.Node => {
  const { children, className, collapsed, toggleCollapsed, prefix } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  return (
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
            name="settings"
            hover={!collapsed}
          />
        </div>
      </div>
      {children}
    </div>
  )
}
