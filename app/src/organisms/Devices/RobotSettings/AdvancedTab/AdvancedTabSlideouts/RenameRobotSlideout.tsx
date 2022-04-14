import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, DIRECTION_COLUMN, TYPOGRAPHY } from '@opentrons/components'
import { Slideout } from '../../../../../atoms/Slideout'
import { StyledText } from '../../../../../atoms/text'
import { PrimaryButton } from '../../../../../atoms/buttons'

interface RenameRobotSlideoutProps {
  isExpanded: boolean
  onCloseClick: () => void
  robotName: string
}

export function RenameRobotSlideout({
  isExpanded,
  onCloseClick,
  robotName,
}: RenameRobotSlideoutProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const [previousRobotName, setPreviousRobotName] = React.useState<string>(
    robotName
  )

  const handleRenameRobot = (): void => {
    // send a new name to api
    // receive the response
    // if success, remove the old name
    // if failure, show error message
  }

  return (
    <Slideout
      title={t('rename_robot_slideout_title')}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <PrimaryButton onClick={} width="100%">
          {t('rename_robot_button')}
        </PrimaryButton>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText as="p">{t('rename_robot_slideout_description')}</StyledText>
        <StyledText as="labelSemiBold">
          {t('rename_robot_slideout_label')}
        </StyledText>
      </Flex>
    </Slideout>
  )
}
