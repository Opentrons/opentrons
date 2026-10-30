import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
  useConditionalConfirm,
} from '@opentrons/components'
import { isDocumentedMutationError } from '@opentrons/react-api-client'

import { MediumButton, SmallButton } from '/app/atoms/buttons'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { OddModal } from '/app/molecules/OddModal'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useResetRobotConfigMutation } from '/app/resources/devices/hooks/useResetRobotConfigMutation'

import type { ReactNode } from 'react'
import type { ResetConfigRequest } from '@opentrons/api-client'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'
import type { SetSettingOption } from './types'

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

/**
 * Selected/unselected state for each reset option we want to display,
 * which is a subset of all the options supported by the server.
 *
 * At the time of writing, this deliberately excludes:
 * - onDeviceDisplay (because we select/deselect it implicitly)
 * - bootScripts (because product doesn't want this exposed to ODD users)
 * - deckConfiguration
 */
interface DisplayedResetOptionState extends Record<string, boolean> {
  gripperOffsetCalibrations: boolean
  labwareOffsets: boolean
  moduleCalibration: boolean
  pipetteOffsetCalibrations: boolean
  runsHistory: boolean
}

const targetOptionsOrder: Array<keyof DisplayedResetOptionState> = [
  'pipetteOffsetCalibrations',
  'gripperOffsetCalibrations',
  'moduleCalibration',
  'labwareOffsets',
  'runsHistory',
]

function isEveryOptionSelected(
  displayedState: DisplayedResetOptionState
): boolean {
  return Object.values(displayedState).every(value => value)
}

function isAnyOptionSelected(
  displayedState: DisplayedResetOptionState
): boolean {
  return Object.values(displayedState).some(value => value)
}

/** Convert the options selected in the UI to the options we want to send to the server. */
function buildResetRequest(
  displayedState: DisplayedResetOptionState
): ResetConfigRequest {
  return {
    resetLabwareOffsets: displayedState.labwareOffsets,

    settingsResets: {
      // Note: keys inside `settingsResets` need to follow the server's HTTP API.
      gripperOffsetCalibrations: displayedState.gripperOffsetCalibrations,
      moduleCalibration: displayedState.moduleCalibration,
      pipetteOffsetCalibrations: displayedState.pipetteOffsetCalibrations,
      runsHistory: displayedState.runsHistory,

      // If the user selected every visible option, implicitly select certain additional options.
      ...(isEveryOptionSelected(displayedState)
        ? {
            authorizedKeys: true,
            onDeviceDisplay: true,
            deckConfiguration: true,
            // todo(mm, 2025-03-27): This omits bootScripts because that's what the older
            // code did, but it's unclear if that's intentional. For comparison, when the
            // desktop app does this, it currently enables every option that the server
            // advertises.
          }
        : {}),
    },
  }
}

interface DeviceResetProps {
  robotName: string
  setCurrentOption: SetSettingOption
}

export function DeviceReset({
  robotName,
  setCurrentOption,
}: DeviceResetProps): ReactNode {
  const { t } = useTranslation('device_settings')
  const [resetOptions, setResetOptions] = useState<DisplayedResetOptionState>({
    pipetteOffsetCalibrations: false,
    gripperOffsetCalibrations: false,
    moduleCalibration: false,
    labwareOffsets: false,
    runsHistory: false,
  })
  const documentationState = useDocumentationState()
  const { postResetConfig, reset } = useResetRobotConfigMutation(
    documentationState,
    robotName,
    {
      onError: error => {
        if (isDocumentedMutationError(error)) {
          reset()
        }
      },
    }
  )

  const handleClick = (): void => {
    postResetConfig(buildResetRequest(resetOptions))
  }

  const {
    confirm: confirmClearData,
    showConfirmation: showConfirmationModal,
    cancel: cancelClearData,
  } = useConditionalConfirm(handleClick, true)

  const renderText = (
    optionId: keyof DisplayedResetOptionState
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
      case 'labwareOffsets':
        optionText = t('clear_option_labware_offsets')
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
          {targetOptionsOrder.map(optionId => {
            const isOptionSelected = resetOptions[optionId]
            const { optionText, subText } = renderText(optionId)
            return (
              <Fragment key={optionId}>
                <OptionButton
                  id={optionId as string} // cast because optionId is a key type
                  type="checkbox"
                  value={optionId}
                  onChange={() => {
                    setResetOptions({
                      ...resetOptions,
                      [optionId]: !isOptionSelected,
                    })
                  }}
                />
                <OptionLabel
                  htmlFor={optionId as string}
                  isSelected={isOptionSelected}
                >
                  <Flex flexDirection={DIRECTION_COLUMN}>
                    <LegacyStyledText
                      forwardedAs="p"
                      fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    >
                      {optionText}
                    </LegacyStyledText>
                    {subText != null ? (
                      <LegacyStyledText
                        forwardedAs="p"
                        color={isOptionSelected ? COLORS.white : COLORS.grey60}
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
                isEveryOptionSelected(resetOptions)
                  ? {
                      pipetteOffsetCalibrations: false,
                      gripperOffsetCalibrations: false,
                      moduleCalibration: false,
                      labwareOffsets: false,
                      runsHistory: false,
                    }
                  : {
                      pipetteOffsetCalibrations: true,
                      gripperOffsetCalibrations: true,
                      moduleCalibration: true,
                      labwareOffsets: true,
                      runsHistory: true,
                    }
              )
            }}
          />
          <OptionLabel
            htmlFor="clearAllStoredData"
            isSelected={isEveryOptionSelected(resetOptions)}
          >
            <Flex flexDirection={DIRECTION_COLUMN}>
              <LegacyStyledText
                forwardedAs="p"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {t('clear_all_stored_data')}
              </LegacyStyledText>
              <LegacyStyledText
                forwardedAs="p"
                color={
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
          disabled={!isAnyOptionSelected(resetOptions)}
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
}: ConfirmClearDataModalProps): ReactNode => {
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
          <LegacyStyledText forwardedAs="p">
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
