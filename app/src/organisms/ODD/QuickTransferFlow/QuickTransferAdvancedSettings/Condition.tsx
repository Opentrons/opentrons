import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InputField,
  POSITION_FIXED,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { NumericalKeyboard } from '/app/atoms/SoftwareKeyboard'
import { i18n } from '/app/i18n'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
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

export function Condition(props: DelayProps): JSX.Element {
  const { kind, onBack, state, dispatch } = props
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const keyboardRef = useRef(null)

  const [currentStep, setCurrentStep] = useState<number>(1)
  const [conditionIsEnabled, setConditionIsEnabled] = useState<boolean>(
    state.conditionAspirate != null || state.conditionAspirate !== 0
  )
  const [conditionVolume, setConditionVolume] = useState<number | null>(
    state.conditionAspirate != null && state.conditionAspirate !== 0
      ? state.conditionAspirate
      : null
  )

  const conditionEnabledDisplayItems = [
    {
      option: true,
      description: t('option_enabled'),
      onClick: () => {
        setConditionIsEnabled(true)
      },
    },
    {
      option: false,
      description: t('option_disabled'),
      onClick: () => {
        setConditionIsEnabled(false)
      },
    },
  ]

  const handleClickBackOrExit = (): void => {
    currentStep > 1 ? setCurrentStep(currentStep - 1) : onBack()
  }

  const eventSetting = `${t('condition')}_${kind}`

  const handleClickSaveOrContinue = (): void => {
    switch (currentStep) {
      case 1:
        if (!conditionIsEnabled) {
          console.log('Condition is disabled, skipping to next step')
          dispatch({
            type: ACTIONS.SET_CONDITION_ASPIRATE,
            conditionAspirate: 0,
          })
          console.log('dispatched')
          onBack()
        } else {
          setCurrentStep(2)
        }
        break
      case 2:
        if (conditionVolume != null) {
          dispatch({
            type: ACTIONS.SET_CONDITION_ASPIRATE,
            conditionAspirate: conditionVolume,
          })
        }
        trackEventWithRobotSerial({
          name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
          properties: {
            setting: eventSetting,
          },
        })
        onBack()
        break
    }
  }

  const setSaveOrContinueButtonText =
    conditionIsEnabled && currentStep === 1
      ? t('shared:continue')
      : t('shared:save')

  // allow a maximum of 10 digits for delay duration
  // const durationRange = { min: 1, max: 9999999999 }
  // const durationError =
  //   delayDuration != null &&
  //   (delayDuration < durationRange.min || delayDuration > durationRange.max)
  //     ? t(`value_out_of_range`, {
  //         min: durationRange.min,
  //         max: durationRange.max,
  //       })
  //     : null

  let buttonIsDisabled = false
  if (currentStep === 1) {
    buttonIsDisabled = conditionIsEnabled == null
  } else if (currentStep === 2) {
    buttonIsDisabled = conditionVolume == null
  }

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={t('condition_before_aspirating')}
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
            {t('condition_description')}
          </StyledText>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            {conditionEnabledDisplayItems.map(displayItem => (
              <RadioButton
                key={displayItem.description}
                isSelected={conditionIsEnabled === displayItem.option}
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
            <InputField
              type="number"
              value={conditionVolume}
              // error={durationError}
              title={t('condition_volume')}
              readOnly
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
              initialValue={String(conditionVolume ?? '')}
              onChange={e => {
                setConditionVolume(Number(e))
              }}
            />
          </Flex>
        </Flex>
      ) : null}
    </Flex>,
    getTopPortalEl()
  )
}
