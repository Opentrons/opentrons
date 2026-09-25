import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_FIXED,
  RadioButton,
  SPACING,
  StyledText,
  TouchInputField,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { NumericalKeyboard } from '/app/atoms/SoftwareKeyboard'
import { i18n } from '/app/i18n'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { parseNumericalInput } from '/app/organisms/ODD/utils/parseNumericalInput'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { ANALYTICS_QUICK_TRANSFER_SETTING_SAVED } from '/app/redux/analytics'

import { ACTIONS } from '../constants'

import type { Dispatch } from 'react'
import type {
  FlowRateKind,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface DelayProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export function Delay(props: DelayProps): JSX.Element {
  const { kind, onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const keyboardRef = useRef(null)
  const inputElementRef = useRef<HTMLInputElement>(null)

  const [currentStep, setCurrentStep] = useState<number>(1)
  const [delayIsEnabled, setDelayIsEnabled] = useState<boolean>(
    kind === 'aspirate'
      ? state.delayAspirate != null
      : state.delayDispense != null
  )
  const existingDelayDuration =
    kind === 'aspirate'
      ? state.delayAspirate?.delayDuration
      : state.delayDispense?.delayDuration
  const [delayDuration, setDelayDuration] = useState<string>(
    existingDelayDuration != null ? String(existingDelayDuration) : ''
  )

  const action =
    kind === 'aspirate'
      ? ACTIONS.SET_DELAY_ASPIRATE
      : ACTIONS.SET_DELAY_DISPENSE

  const delayEnabledDisplayItems = [
    {
      option: true,
      description: t('option_enabled'),
      onClick: () => {
        setDelayIsEnabled(true)
      },
    },
    {
      option: false,
      description: t('option_disabled'),
      onClick: () => {
        setDelayIsEnabled(false)
      },
    },
  ]

  const handleClickBackOrExit = (): void => {
    currentStep > 1 ? setCurrentStep(currentStep - 1) : onBack()
  }

  const handleClickSaveOrContinue = (): void => {
    if (currentStep === 1) {
      if (!delayIsEnabled) {
        dispatch({
          type: action,
          delaySettings: undefined,
        })
        trackEventWithRobotSerial({
          name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
          properties: {
            setting: `Delay_${kind}`,
          },
        })
        onBack()
      } else {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      if (parsedDuration.result === 'success') {
        dispatch({
          type: action,
          delaySettings: {
            delayDuration: parsedDuration.data,
          },
        })
        trackEventWithRobotSerial({
          name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
          properties: {
            setting: `Delay_${kind}`,
          },
        })
      }
      onBack()
    }
  }

  const setSaveOrContinueButtonText =
    delayIsEnabled && currentStep < 2 ? t('shared:continue') : t('shared:save')

  const durationRange = { min: 0.1, max: 9999999999 }
  const parsedDuration = parseNumericalInput(delayDuration, {
    allowDecimal: true,
    allowNegative: false,
    min: durationRange.min,
    max: durationRange.max,
  })
  const durationErrorMessage =
    parsedDuration.result === 'rangeError'
      ? t('value_out_of_range', {
          min: parsedDuration.min,
          max: parsedDuration.max,
        })
      : parsedDuration.result === 'syntaxError'
        ? t('enter_a_valid_number')
        : null
  let buttonIsDisabled = false
  if (currentStep === 2) {
    buttonIsDisabled = parsedDuration.result !== 'success'
  }

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={
          kind === 'aspirate'
            ? t('delay_after_aspirating')
            : t('delay_before_dispensing')
        }
        buttonText={i18n.format(setSaveOrContinueButtonText, 'capitalize')}
        onClickBack={handleClickBackOrExit}
        onClickButton={handleClickSaveOrContinue}
        top={SPACING.spacing8}
        buttonIsDisabled={buttonIsDisabled}
      />
      {currentStep === 1 ? (
        <Flex
          marginTop={SPACING.spacing120}
          flexDirection={DIRECTION_COLUMN}
          padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
          gridGap={SPACING.spacing24}
          width="100%"
        >
          <StyledText oddStyle="level4HeaderRegular">
            {kind === 'aspirate'
              ? t('delay_description_aspirate')
              : t('delay_description_dispense')}
          </StyledText>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            {delayEnabledDisplayItems.map(displayItem => (
              <RadioButton
                key={displayItem.description}
                isSelected={delayIsEnabled === displayItem.option}
                onChange={displayItem.onClick}
                buttonValue={displayItem.description}
                buttonLabel={displayItem.description}
                radioButtonType="large"
              />
            ))}
          </Flex>
        </Flex>
      ) : null}
      {currentStep === 2 ? (
        <Flex
          alignSelf={ALIGN_CENTER}
          gridGap={SPACING.spacing48}
          paddingX={SPACING.spacing40}
          padding={`${SPACING.spacing16} ${SPACING.spacing40} ${SPACING.spacing40}`}
          marginTop="7.75rem" // using margin rather than justify due to content moving with error message
          alignItems={ALIGN_CENTER}
          height="22rem"
        >
          <Flex
            width="30.5rem"
            height="100%"
            gridGap={SPACING.spacing24}
            flexDirection={DIRECTION_COLUMN}
            marginTop={SPACING.spacing68}
          >
            <TouchInputField
              ref={inputElementRef}
              autoFocus
              type="text"
              value={delayDuration}
              error={durationErrorMessage}
              label={t('delay_duration_s')}
              onChange={e => {
                setDelayDuration(e.target.value)
              }}
            />
          </Flex>
          <Flex
            paddingX={SPACING.spacing24}
            height="21.25rem"
            marginTop="7.75rem"
            borderRadius="0"
          >
            <NumericalKeyboard
              keyboardRef={keyboardRef}
              inputElementRef={inputElementRef}
              isDecimal
            />
          </Flex>
        </Flex>
      ) : null}
    </Flex>,
    getTopPortalEl()
  )
}
