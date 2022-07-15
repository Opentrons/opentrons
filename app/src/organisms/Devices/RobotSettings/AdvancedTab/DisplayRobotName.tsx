import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Box,
  SPACING,
  SPACING_AUTO,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'
import { TertiaryButton } from '../../../../atoms/buttons'
import { useIsRobotBusy } from '../../hooks'
interface DisplayRobotNameProps {
  robotName: string
  updateIsExpanded: (
    isExpanded: boolean,
    type: 'factoryReset' | 'renameRobot'
  ) => void
  updateIsRobotBusy: (isRobotBusy: boolean) => void
}

export function DisplayRobotName({
  robotName,
  updateIsExpanded,
  updateIsRobotBusy,
}: DisplayRobotNameProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const isBusy = useIsRobotBusy()

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    if (isBusy) {
      updateIsRobotBusy(true)
    } else {
      updateIsExpanded(true, 'renameRobot')
    }
  }

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          as="h2"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginBottom={SPACING.spacing4}
          id="AdvancedSettings_About"
        >
          {t('about_advanced')}
        </StyledText>
        <StyledText
          as="p"
          css={TYPOGRAPHY.pSemiBold}
          marginBottom={SPACING.spacing2}
        >
          {t('robot_name')}
        </StyledText>
        <StyledText as="p">{robotName}</StyledText>
      </Box>
      <TertiaryButton
        marginLeft={SPACING_AUTO}
        onClick={handleClick}
        id="RobotSettings_RenameRobot"
      >
        {t('robot_rename_button')}
      </TertiaryButton>
    </Flex>
  )
}
