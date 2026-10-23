import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useUpdateRobotSettingMutation } from '@opentrons/react-api-client'

import { ToggleButton } from '/app/atoms/buttons'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/utils'

import type { MouseEventHandler, ReactNode } from 'react'
import type { RobotSettingsField } from '@opentrons/api-client'

interface ShortTrashBinProps {
  settings: RobotSettingsField | undefined
  isRobotBusy: boolean
}

export function ShortTrashBin({
  settings,
  isRobotBusy,
}: ShortTrashBinProps): ReactNode {
  const { t } = useTranslation('device_settings')
  const { updateRobotSetting } = useUpdateRobotSettingMutation(
    ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
  )
  const value = settings?.value ? settings.value : false
  const id = settings?.id ? settings.id : 'shortTrashBin'

  const handleClick: MouseEventHandler<Element> = () => {
    if (!isRobotBusy) {
      updateRobotSetting({ id, value: !value })
    }
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <LegacyStyledText
          css={TYPOGRAPHY.pSemiBold}
          paddingBottom={SPACING.spacing4}
        >
          {t('short_trash_bin')}
        </LegacyStyledText>
        <LegacyStyledText css={TYPOGRAPHY.pRegular}>
          {t('short_trash_bin_description')}
        </LegacyStyledText>
      </Box>
      <ToggleButton
        label="short_trash_bin"
        toggledOn={settings?.value === true}
        onClick={handleClick}
        disabled={isRobotBusy}
      />
    </Flex>
  )
}
