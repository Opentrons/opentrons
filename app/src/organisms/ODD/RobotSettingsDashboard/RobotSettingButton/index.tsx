import { Icon, LegacyStyledText } from '@opentrons/components'

import styles from './robotsettingbutton.module.css'

import type { MouseEventHandler, ReactNode } from 'react'
import type { IconName } from '@opentrons/components'

interface RobotSettingButtonProps {
  settingName: string
  onClick: MouseEventHandler
  iconName?: IconName
  settingInfo?: string
  rightElement?: ReactNode
  dataTestId?: string
}

export function RobotSettingButton({
  settingName,
  iconName,
  onClick,
  settingInfo,
  rightElement,
  dataTestId,
}: RobotSettingButtonProps): ReactNode {
  return (
    <button
      className={styles.setting_button}
      onClick={onClick}
      data-testid={dataTestId}
    >
      <div className={styles.content_wrapper}>
        {iconName != null ? (
          <Icon name={iconName} className={styles.icon_large} color="#171717" />
        ) : null}
        <div className={styles.text_content}>
          <LegacyStyledText forwardedAs="h4" className={styles.setting_name}>
            {settingName}
          </LegacyStyledText>
          {settingInfo != null ? (
            <LegacyStyledText forwardedAs="h4" className={styles.setting_info}>
              {settingInfo}
            </LegacyStyledText>
          ) : null}
        </div>
      </div>
      {rightElement != null ? (
        rightElement
      ) : (
        <div className={styles.right_element_wrapper}>
          <Icon name="more" className={styles.icon_large} color="#171717" />
        </div>
      )}
    </button>
  )
}
