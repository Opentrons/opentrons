import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Box,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'
import { ToggleButton } from '../../../../atoms/buttons'
import { useIsRobotBusy } from '../../hooks'
import { updateSetting } from '../../../../redux/robot-settings'

import type { Dispatch } from '../../../../redux/types'
import type { RobotSettingsField } from '../../../../redux/robot-settings/types'

interface ShortTrashBinProps {
  settings: RobotSettingsField | undefined
  robotName: string
  updateIsRobotBusy: (isRobotBusy: boolean) => void
}

export function ShortTrashBin({
  settings,
  robotName,
  updateIsRobotBusy,
}: ShortTrashBinProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  const value = settings?.value ? settings.value : false
  const id = settings?.id ? settings.id : 'shortTrashBin'
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
          {t('short_trash_bin')}
        </StyledText>
        <StyledText css={TYPOGRAPHY.pRegular}>
          {t('short_trash_bin_description')}
        </StyledText>
      </Box>
      <ToggleButton
        label="short_trash_bin"
        toggledOn={settings?.value === true}
        onClick={handleClick}
        id="AdvancedSettings_shortTrashBin"
      />
    </Flex>
  )
}
