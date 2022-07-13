import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  Box,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'
import { ToggleButton } from '../../../../atoms/buttons'
import { useIsRobotBusy } from '../../hooks'
import { updateSetting } from '../../../../redux/robot-settings'

import type { Dispatch } from '../../../../redux/types'
import type { RobotSettingsField } from '../../../../redux/robot-settings/types'

interface UseOlderAspirateBehaviorProps {
  settings: RobotSettingsField | undefined
  robotName: string
  updateIsRobotBusy: (isRobotBusy: boolean) => void
}

export function UseOlderAspirateBehavior({
  settings,
  robotName,
  updateIsRobotBusy,
}: UseOlderAspirateBehaviorProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  const value = settings?.value ? settings.value : false
  const id = settings?.id ? settings.id : 'useOldAspirationFunctions'
  const isBusy = useIsRobotBusy()

  const handleClick: React.MouseEventHandler<Element> = () => {
    if (isBusy) {
      updateIsRobotBusy(true)
    } else {
      dispatch(updateSetting(robotName, id, !value))
    }
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          css={TYPOGRAPHY.pSemiBold}
          paddingBottom={SPACING.spacing2}
          id="AdvancedSettings_devTools"
        >
          {t('use_older_aspirate')}
        </StyledText>
        <StyledText as="p">{t('use_older_aspirate_description')}</StyledText>
      </Box>
      <ToggleButton
        label="use_older_aspirate_behavior"
        toggledOn={settings?.value === true}
        onClick={handleClick}
        id="AdvancedSettings_useOlderAspirate"
      />
    </Flex>
  )
}
