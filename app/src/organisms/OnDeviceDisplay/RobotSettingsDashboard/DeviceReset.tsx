import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  Flex,
  Btn,
  DIRECTION_COLUMN,
  Icon,
  ALIGN_CENTER,
  TYPOGRAPHY,
  AlertPrimaryButton,
  DIRECTION_ROW,
  COLORS,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import {
  getResetConfigOptions,
  fetchResetConfigOptions,
  resetConfig,
} from '../../../redux/robot-admin'
import { useDispatchApiRequest } from '../../../redux/robot-api'

import type { Dispatch, State } from '../../../redux/types'
import type { ResetConfigRequest } from '../../../redux/robot-admin/types'
import type { SettingOption } from '../../../pages/OnDeviceDisplay/RobotSettingsDashboard/RobotSettingButton'

interface LabelProps {
  isSelected?: boolean
}

const OptionButton = styled.input`
  display: none;
`

const OptionLabel = styled.label<LabelProps>`
  padding: ${SPACING.spacing16} ${SPACING.spacing24};
  border: 2px solid
    ${({ isSelected }) =>
      isSelected === true ? COLORS.blueEnabled : COLORS.light2};
  border-radius: ${BORDERS.borderRadiusSize4};
  background: ${({ isSelected }) =>
    isSelected === true ? COLORS.medBlue : COLORS.white};
`

interface DeviceResetProps {
  robotName: string
  setCurrentOption: (currentOption: SettingOption | null) => void
}

export function DeviceReset({
  robotName,
  setCurrentOption,
}: DeviceResetProps): JSX.Element {
  const { t } = useTranslation(['device_settings'])
  const [resetOptions, setResetOptions] = React.useState<ResetConfigRequest>({})
  const options = useSelector((state: State) =>
    getResetConfigOptions(state, robotName)
  )
  const [dispatchRequest] = useDispatchApiRequest()

  // ToDo (kj:02/07/2023) gripperCalibration might be different since the option isn't implemented yet
  // Currently boot script will be added in the future
  const targetOptions = [
    'pipetteOffsetCalibrations',
    'gripperCalibration',
    'runsHistory',
  ]
  const availableOptions = options.filter(option =>
    targetOptions.includes(option.id)
  )
  const dispatch = useDispatch<Dispatch>()

  const handleClick = (): void => {
    if (resetOptions != null) {
      dispatchRequest(resetConfig(robotName, resetOptions))
    }
  }

  const renderText = (optionId: string): string => {
    switch (optionId) {
      case 'pipetteOffsetCalibrations':
        return t('clear_option_pipette_calibrations')
      // ToDo (kj:02/07/2023) gripperCalibration same as the above
      case 'gripperCalibration':
        return t('clear_option_gripper_calibration')
      case 'runsHistory':
        return t('clear_option_runs_history')
      default:
        return ''
    }
  }
  React.useEffect(() => {
    dispatch(fetchResetConfigOptions(robotName))
  }, [dispatch, robotName])

  return (
    <Flex flexDirection={DIRECTION_COLUMN} paddingY={SPACING.spacing32}>
      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Flex flexDirection={DIRECTION_ROW}>
          <Btn onClick={() => setCurrentOption(null)}>
            <Icon name="back" size="3rem" />
          </Btn>
          <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
            {t('device_reset')}
          </StyledText>
        </Flex>
        <Flex
          flexDirection={DIRECTION_ROW}
          backgroundColor={COLORS.warningBackgroundMed}
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing12}
          padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
          borderRadius={BORDERS.borderRadiusSize3}
        >
          <Icon name="ot-alert" size="1.5rem" color={COLORS.warningEnabled} />
          <StyledText
            fontSize="1.375rem"
            lineHeight="1.875rem"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {t('device_resets_cannot_be_undone')}
          </StyledText>
        </Flex>
      </Flex>
      <Flex
        marginTop={SPACING.spacing24}
        gridGap={SPACING.spacing8}
        flexDirection={DIRECTION_COLUMN}
      >
        {availableOptions.map(option => (
          <React.Fragment key={option.id}>
            <OptionButton
              id={option.id}
              type="checkbox"
              value={option.id}
              onChange={() =>
                setResetOptions({
                  ...resetOptions,
                  [option.id]: !(resetOptions[option.id] ?? false),
                })
              }
            />
            <OptionLabel
              htmlFor={option.id}
              isSelected={resetOptions[option.id]}
            >
              <StyledText
                fontSize="1.375rem"
                lineHeight="1.875rem"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {renderText(option.id)}
              </StyledText>
            </OptionLabel>
          </React.Fragment>
        ))}
      </Flex>
      <AlertPrimaryButton
        paddingY={SPACING.spacing24}
        marginTop="3.5rem"
        disabled={
          Object.keys(resetOptions).length === 0 ||
          availableOptions.every(option => resetOptions[option.id] === false)
        }
        onClick={handleClick}
      >
        <StyledText
          fontSize="1.5rem"
          lineHeight="1.375rem"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        >
          {t('clear_data_and_restart_robot')}
        </StyledText>
      </AlertPrimaryButton>
    </Flex>
  )
}
