import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useUpdateRobotSettingMutation } from '@opentrons/react-api-client'

import { ToggleButton } from '/app/atoms/buttons'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'

import type { MouseEventHandler, ReactNode } from 'react'
import type { RobotSettingsField } from '@opentrons/api-client'

interface GantryHomingProps {
  settings: RobotSettingsField | undefined
  isRobotBusy: boolean
}

export function GantryHoming({
  settings,
  isRobotBusy,
}: GantryHomingProps): ReactNode {
  const { t } = useTranslation('device_settings')
  const documentationState = useDocumentationState()
  const { updateRobotSetting } =
    useUpdateRobotSettingMutation(documentationState)
  const value = settings?.value ? settings.value : false
  const id = settings?.id ? settings.id : 'disableHomeOnBoot'

  const handleClick: MouseEventHandler<Element> = () => {
    if (!isRobotBusy) {
      updateRobotSetting({ id, value: !value })
    }
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
      <StyledText forwardedAs="h2" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('usage_settings')}
      </StyledText>
      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing4}
          width="70%"
        >
          <StyledText
            forwardedAs="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {t('gantry_homing')}
          </StyledText>
          <StyledText forwardedAs="p">
            {t('gantry_homing_description')}
          </StyledText>
        </Flex>
        <ToggleButton
          label="gantry_homing"
          toggledOn={!value}
          onClick={handleClick}
          disabled={isRobotBusy}
        />
      </Flex>
    </Flex>
  )
}
