import { useState, useEffect, Fragment } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  useConditionalConfirm,
} from '@opentrons/components'

import { MediumButton, SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import {
  getResetConfigOptions,
  fetchResetConfigOptions,
  resetConfig,
} from '/app/redux/robot-admin'
import { useDispatchApiRequest } from '/app/redux/robot-api'

import type { Dispatch, State } from '/app/redux/types'
import type { ResetConfigRequest } from '/app/redux/robot-admin/types'
import type { SetSettingOption } from './types'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

interface LabelProps {
  isSelected?: boolean
}

const OptionButton = styled.input`
  display: none;
`

const OptionLabel = styled.label<LabelProps>`
  padding: ${SPACING.spacing16} ${SPACING.spacing24};
  border-radius: ${BORDERS.borderRadius16};
  color: ${({ isSelected }) =>
    isSelected === true ? COLORS.white : COLORS.black90};
  background: ${({ isSelected }) =>
    isSelected === true ? COLORS.blue50 : COLORS.blue35};
`

interface DeviceResetProps {
  robotName: string
  setCurrentOption: SetSettingOption
}

export function DeviceReset({
  robotName,
  setCurrentOption,
}: DeviceResetProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const [resetOptions, setResetOptions] = useState<ResetConfigRequest>({})
  const options = useSelector((state: State) =>
    getResetConfigOptions(state, robotName)
  )
  const [dispatchRequest] = useDispatchApiRequest()

  const targetOptionsOrder = [
    'pipetteOffsetCalibrations',
    'gripperOffsetCalibrations',
    'moduleCalibration',
    'runsHistory',
  ]

  const availableOptions = options
    // filtering out ODD setting because this gets implicitly cleared if all settings are selected
    // filtering out boot scripts since product doesn't want this exposed to ODD users
    .filter(
      ({ id }) =>
        !['onDeviceDisplay', 'bootScripts', 'deckConfiguration'].includes(id)
    )
    .sort(
      (a, b) =>
        targetOptionsOrder.indexOf(a.id) - targetOptionsOrder.indexOf(b.id)
    )
  const dispatch = useDispatch<Dispatch>()

  const availableOptionsToDisplay = availableOptions.filter(
    ({ id }) => !['authorizedKeys'].includes(id)
  )

  const isEveryOptionSelected = (obj: ResetConfigRequest): boolean => {
    for (const key of targetOptionsOrder) {
      if (obj != null && !obj[key]) {
        return false
      }
    }
    return true
  }

  const handleClick = (): void => {
    if (resetOptions != null) {
      const { ...serverResetOptions } = resetOptions
      dispatchRequest(resetConfig(robotName, serverResetOptions))
    }
  }

  const {
    confirm: confirmClearData,
    showConfirmation: showConfirmationModal,
    cancel: cancelClearData,
  } = useConditionalConfirm(handleClick, true)

  const renderText = (
    optionId: string
  ): { optionText: string; subText?: string } => {
    let optionText = ''
    let subText
    switch (optionId) {
      case 'pipetteOffsetCalibrations':
        optionText = t('clear_option_pipette_calibrations')
        break
      case 'gripperOffsetCalibrations':
        optionText = t('clear_option_gripper_calibration')
        break
      case 'moduleCalibration':
        optionText = t('clear_option_module_calibration')
        break
      case 'runsHistory':
        optionText = t('clear_option_runs_history')
        subText = t('clear_option_runs_history_subtext')
        break

      case 'factoryReset':
        optionText = t('factory_reset')
        subText = t('factory_reset_description')
        break
      default:
        break
    }
    return {
      optionText,
      subText,
    }
  }
  useEffect(() => {
    dispatch(fetchResetConfigOptions(robotName))
  }, [dispatch, robotName])

  useEffect(() => {
    if (
      isEveryOptionSelected(resetOptions) &&
      (!resetOptions.authorizedKeys ||
        !resetOptions.onDeviceDisplay ||
        !resetOptions.deckConfiguration)
    ) {
      setResetOptions({
        ...resetOptions,
        authorizedKeys: true,
        onDeviceDisplay: true,
        deckConfiguration: true,
      })
    }
  }, [resetOptions])

  useEffect(() => {
    if (
      !isEveryOptionSelected(resetOptions) &&
      resetOptions.authorizedKeys &&
      resetOptions.onDeviceDisplay &&
      resetOptions.deckConfiguration
    ) {
      setResetOptions({
        ...resetOptions,
        authorizedKeys: false,
        onDeviceDisplay: false,
        deckConfiguration: false,
      })
    }
  }, [resetOptions])

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      {showConfirmationModal && (
        <ConfirmClearDataModal
          confirmClearData={confirmClearData}
          cancelClearData={cancelClearData}
        />
      )}
      <ChildNavigation
        header={t('device_reset')}
        inlineNotification={{
          heading: t('device_resets_cannot_be_undone'),
          type: 'alert',
        }}
        onClickBack={() => {
          setCurrentOption(null)
        }}
      />
      <Flex
        gridGap={SPACING.spacing24}
        flexDirection={DIRECTION_COLUMN}
        paddingX={SPACING.spacing40}
        marginTop="7.75rem"
      >
        <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
          {availableOptionsToDisplay.map(option => {
            const { optionText, subText } = renderText(option.id)
            return (
              <Fragment key={option.id}>
                <OptionButton
                  id={option.id}
                  type="checkbox"
                  value={option.id}
                  onChange={() => {
                    setResetOptions({
                      ...resetOptions,
                      [option.id]: !(resetOptions[option.id] ?? false),
                    })
                  }}
                />
                <OptionLabel
                  htmlFor={option.id}
                  isSelected={resetOptions[option.id]}
                >
                  <Flex flexDirection={DIRECTION_COLUMN}>
                    <LegacyStyledText
                      as="p"
                      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    >
                      {optionText}
                    </LegacyStyledText>
                    {subText != null ? (
                      <LegacyStyledText
                        as="p"
                        color={
                          resetOptions[option.id] ?? false
                            ? COLORS.white
                            : COLORS.grey60
                        }
                      >
                        {subText}
                      </LegacyStyledText>
                    ) : null}
                  </Flex>
                </OptionLabel>
              </Fragment>
            )
          })}

          <OptionButton
            id="clearAllStoredData"
            type="checkbox"
            value="clearAllStoredData"
            onChange={() => {
              setResetOptions(
                (resetOptions.authorizedKeys ?? false) &&
                  (resetOptions.onDeviceDisplay ?? false)
                  ? {}
                  : availableOptions.reduce(
                      (acc, val) => {
                        return {
                          ...acc,
                          [val.id]: true,
                        }
                      },
                      { authorizedKeys: true, onDeviceDisplay: true }
                    )
              )
            }}
          />
          <OptionLabel
            htmlFor="clearAllStoredData"
            isSelected={
              ((resetOptions.authorizedKeys ?? false) &&
                (resetOptions.onDeviceDisplay ?? false)) ||
              isEveryOptionSelected(resetOptions)
            }
          >
            <Flex flexDirection={DIRECTION_COLUMN}>
              <LegacyStyledText
                as="p"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {t('clear_all_stored_data')}
              </LegacyStyledText>
              <LegacyStyledText
                as="p"
                color={
                  ((resetOptions.authorizedKeys ?? false) &&
                    (resetOptions.onDeviceDisplay ?? false)) ||
                  isEveryOptionSelected(resetOptions)
                    ? COLORS.white
                    : COLORS.grey60
                }
              >
                {t('clear_all_stored_data_description')}
              </LegacyStyledText>
            </Flex>
          </OptionLabel>
        </Flex>
        <MediumButton
          data-testid="DeviceReset_clear_data_button"
          buttonText={t('clear_data_and_restart_robot')}
          buttonType="alert"
          disabled={
            Object.keys(resetOptions).length === 0 ||
            availableOptions.every(
              option =>
                resetOptions[option.id] === false ||
                resetOptions[option.id] === undefined
            )
          }
          onClick={confirmClearData}
        />
      </Flex>
    </Flex>
  )
}

interface ConfirmClearDataModalProps {
  cancelClearData: () => void
  confirmClearData: () => void
}

export const ConfirmClearDataModal = ({
  cancelClearData,
  confirmClearData,
}: ConfirmClearDataModalProps): JSX.Element => {
  const { t } = useTranslation(['device_settings', 'shared'])
  const modalHeader: OddModalHeaderBaseProps = {
    title: t('confirm_device_reset_heading'),
    hasExitIcon: false,
    iconName: 'ot-alert',
    iconColor: COLORS.yellow50,
  }
  return (
    <OddModal
      modalSize="medium"
      header={modalHeader}
      onOutsideClick={cancelClearData}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing12}
          paddingBottom={SPACING.spacing32}
        >
          <LegacyStyledText as="p">
            {t('confirm_device_reset_description')}
          </LegacyStyledText>
        </Flex>
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing8}
          width="100%"
        >
          <SmallButton
            flex="1"
            buttonText={t('shared:go_back')}
            onClick={cancelClearData}
          />
          <SmallButton
            flex="1"
            buttonType="alert"
            buttonText={t('shared:confirm')}
            onClick={confirmClearData}
          />
        </Flex>
      </Flex>
    </OddModal>
  )
}
