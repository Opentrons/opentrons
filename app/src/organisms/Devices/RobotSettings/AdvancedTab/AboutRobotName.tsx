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
import { useAllSessionsQuery } from '@opentrons/react-api-client'

import { StyledText } from '../../../../atoms/text'
import { TertiaryButton } from '../../../../atoms/buttons'
import { useCurrentRunId } from '../../../ProtocolUpload/hooks'
interface AboutRobotNameProps {
  robotName: string
  updateIsExpanded: (
    isExpanded: boolean,
    type: 'factoryReset' | 'renameRobot'
  ) => void
  updateIsRobotBusy: (isRobotBusy: boolean) => void
}

export function AboutRobotName({
  robotName,
  updateIsExpanded,
  updateIsRobotBusy,
}: AboutRobotNameProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const isRobotBusy = useCurrentRunId() !== null
  const allSessionsQueryResponse = useAllSessionsQuery()

  const checkIsRobotBusy = (): boolean => {
    // check robot is busy or there is a session => not allow to change the setting
    const data =
      allSessionsQueryResponse.data != null ? allSessionsQueryResponse.data : {}
    console.log('length', Object.keys(data).length, Object.values(data).length)
    return !(!isRobotBusy && Object.keys(data).length !== 0)
  }

  const handleClickRenameRobot = (): void => {
    console.log('clicked')
    const isRobotBusy = checkIsRobotBusy()
    if (isRobotBusy) {
      updateIsRobotBusy(isRobotBusy)
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
        // onClick={() => updateIsExpanded(true, 'renameRobot')}
        onClick={() => handleClickRenameRobot()}
        id="RobotSettings_RenameRobot"
      >
        {t('robot_rename_button')}
      </TertiaryButton>
    </Flex>
  )
}
