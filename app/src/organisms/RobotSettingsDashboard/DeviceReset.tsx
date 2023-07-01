import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  Flex,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  COLORS,
  SPACING,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { MediumButton } from '../../atoms/buttons'
import { ChildNavigation } from '../../organisms/ChildNavigation'
import {
  getResetConfigOptions,
  fetchResetConfigOptions,
  resetConfig,
} from '../../redux/robot-admin'
import { useDispatchApiRequest } from '../../redux/robot-api'

import type { Dispatch, State } from '../../redux/types'
import type { ResetConfigRequest } from '../../redux/robot-admin/types'
import type { SetSettingOption } from '../../pages/OnDeviceDisplay/RobotSettingsDashboard'

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
  color: ${({ isSelected }) =>
    isSelected === true ? COLORS.white : COLORS.darkBlack100};
  background: ${({ isSelected }) =>
    isSelected === true ? COLORS.blueEnabled : COLORS.mediumBlueEnabled};
`

interface DeviceResetProps {
  robotName: string
  setCurrentOption: SetSettingOption
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
    'gripperOffsetCalibrations',
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

  let subText: string
  const renderText = (optionId: string): string => {
    switch (optionId) {
      case 'pipetteOffsetCalibrations':
        return t('clear_option_pipette_calibrations')
      case 'gripperOffsetCalibrations':
        return t('clear_option_gripper_calibration')
      case 'runsHistory':
        subText = t('clear_option_runs_history_subtext')
        return t('clear_option_runs_history')
      // ToDo (kj:07/01/2023) we need to add factory reset case
      // Asking a question about text Desktop Factory Reset/Touchscreen Factory rest
      case 'factoryReset':
        subText = t(
          'Resets all settings. You’ll have to redo initial setup before using the robot again.'
        )
        return t('factory_reset')
      default:
        return ''
    }
  }
  React.useEffect(() => {
    dispatch(fetchResetConfigOptions(robotName))
  }, [dispatch, robotName])

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <ChildNavigation
        header={t('device_reset')}
        inlineNotification={{
          heading: t('device_resets_cannot_be_undone'),
          type: 'alert',
        }}
        onClickBack={() => setCurrentOption(null)}
      />
      <Flex
        gridGap={SPACING.spacing24}
        flexDirection={DIRECTION_COLUMN}
        paddingX={SPACING.spacing40}
      >
        <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
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
                <Flex flexDirection={DIRECTION_COLUMN}>
                  <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                    {renderText(option.id)}
                  </StyledText>
                  {option.id === 'runsHistory' ? (
                    <StyledText
                      as="p"
                      color={
                        resetOptions[option.id]
                          ? COLORS.white
                          : COLORS.darkBlack70
                      }
                    >
                      {subText}
                    </StyledText>
                  ) : null}
                </Flex>
              </OptionLabel>
            </React.Fragment>
          ))}
        </Flex>
        <MediumButton
          data-testid="DeviceReset_clear_data_button"
          buttonText={t('clear_data_and_restart_robot')}
          buttonType="alert"
          disabled={
            Object.keys(resetOptions).length === 0 ||
            availableOptions.every(option => resetOptions[option.id] === false)
          }
          onClick={handleClick}
        />
      </Flex>
    </Flex>
  )
}
