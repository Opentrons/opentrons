// @flow
import * as React from 'react'
import { IconButton, HoverTooltip } from '@opentrons/components'
import { i18n } from '../../../localization'
import styles from '../StepEditForm.css'

type Props = {
  className?: ?string,
  collapsed?: ?boolean,
  toggleCollapsed: () => mixed,
  prefix: 'aspirate' | 'dispense',
  children?: React.Node,
}

export const AspDispSection = (props: Props) => {
  const { children, className, collapsed, toggleCollapsed, prefix } = props

  return (
    <div className={className}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>{prefix}</span>
        <HoverTooltip
          key={collapsed ? 'collapsed' : 'expanded'} // NOTE: without this key, the IconButton will not re-render unless clicked
          tooltipComponent={i18n.t('tooltip.advanced_settings')}
        >
          {hoverTooltipHandlers => (
            <div
              {...hoverTooltipHandlers}
              onClick={toggleCollapsed}
              className={styles.advanced_settings_button_wrapper}
            >
              <IconButton
                className={styles.advanced_settings_button}
                name="settings"
                hover={!collapsed}
              />
            </div>
          )}
        </HoverTooltip>
      </div>
      {children}
    </div>
  )
}
