import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  COLORS,
} from '@opentrons/components'
import { useUpdateRobotNameMutation } from '@opentrons/react-api-client'
import { removeRobot } from '../../../../../redux/discovery'
import { Slideout } from '../../../../../atoms/Slideout'
import { StyledText } from '../../../../../atoms/text'
import { PrimaryButton } from '../../../../../atoms/Buttons'
import { InputField } from '../../../../../atoms/InputField'

import type { UpdatedRobotName } from '@opentrons/api-client'
import type { Dispatch } from '../../../../../redux/types'
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
  const [newRobotName, setNewRobotName] = React.useState<string | null>()
  const [previousRobotName, setPreviousRobotName] = React.useState<string>(
    robotName
  )
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  const { updateRobotName } = useUpdateRobotNameMutation({
    onSuccess: (data: UpdatedRobotName) => {
      dispatch(removeRobot(previousRobotName))
      data.name != null &&
        history.push(`/devices/${data.name as string}/robot-settings`)
    },
    onError: error => {
      console.error('error', error.message)
    },
  })

  const handleRenameRobot = (): void => {
    setPreviousRobotName(robotName)
    updateRobotName(newRobotName as string)
  }

  return (
    <Slideout
      title={t('rename_robot_slideout_title')}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <PrimaryButton
          disabled={newRobotName == null || newRobotName.length > 35}
          onClick={handleRenameRobot}
          width="100%"
        >
          {t('rename_robot_button')}
        </PrimaryButton>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText as="p" marginBottom={SPACING.spacing4}>
          {t('rename_robot_slideout_description')}
        </StyledText>
        <StyledText
          as="label"
          css={TYPOGRAPHY.labelSemiBold}
          marginBottom={SPACING.spacing3}
        >
          {t('rename_robot_slideout_label')}
        </StyledText>
        <InputField
          data-testid="rename-robot_input"
          type="text"
          value={newRobotName}
          onChange={e => setNewRobotName(e.target.value)}
          error={null}
        />
        <StyledText as="label" color={COLORS.darkGreyEnabled}>
          {t('rename_robot_input_limitation_label')}
        </StyledText>
      </Flex>
    </Slideout>
  )
}
