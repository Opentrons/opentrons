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

interface MixProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export function Mix(props: MixProps): JSX.Element {
  const { kind, onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const keyboardRef = useRef(null)

  const [mixIsEnabled, setMixIsEnabled] = useState<boolean>(
    kind === 'aspirate'
      ? state.mixOnAspirate != null
      : state.mixOnDispense != null
  )
  const [currentStep, setCurrentStep] = useState<number>(1)
  const existingMixVolume =
    kind === 'aspirate'
      ? state.mixOnAspirate?.mixVolume
      : state.mixOnDispense?.mixVolume
  const existingMixReps =
    kind === 'aspirate'
      ? state.mixOnAspirate?.repetitions
      : state.mixOnDispense?.repetitions
  const [mixVolume, setMixVolume] = useState<string>(
    existingMixVolume != null ? String(existingMixVolume) : ''
  )
  const [mixReps, setMixReps] = useState<string>(
    existingMixReps != null ? String(existingMixReps) : ''
  )

  const mixAction =
    kind === 'aspirate'
      ? ACTIONS.SET_MIX_ON_ASPIRATE
      : ACTIONS.SET_MIX_ON_DISPENSE

  const enableMixDisplayItems = [
    {
      option: true,
      description: t('option_enabled'),
      onClick: () => {
        setMixIsEnabled(true)
      },
    },
    {
      option: false,
      description: t('option_disabled'),
      onClick: () => {
        setMixIsEnabled(false)
      },
    },
  ]

  const handleClickBackOrExit = (): void => {
    currentStep > 1 ? setCurrentStep(currentStep - 1) : onBack()
  }

  const handleClickSaveOrContinue = (): void => {
    switch (currentStep) {
      case 1:
        if (!mixIsEnabled) {
          dispatch({
            type: mixAction,
            mixSettings: undefined,
          })
          trackEventWithRobotSerial({
            name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
            properties: {
              setting: `Mix_${kind}`,
            },
          })
          onBack()
        } else {
          setCurrentStep(2)
        }
        break
      case 2:
        setCurrentStep(3)
        break
      case 3:
        if (
          parsedMixVolume.result === 'success' &&
          parsedMixReps.result === 'success'
        ) {
          dispatch({
            type: mixAction,
            mixSettings: {
              mixVolume: parsedMixVolume.data,
              repetitions: parsedMixReps.data,
            },
          })
          trackEventWithRobotSerial({
            name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
            properties: {
              setting: `Mix_${kind}`,
            },
          })
        }
        onBack()
        break
      default:
        break
    }
  }

  const setSaveOrContinueButtonText =
    mixIsEnabled && currentStep < 3 ? t('shared:continue') : t('shared:save')

  const maxPipetteVolume = Object.values(state.pipette.liquids)[0].maxVolume
  const tipVolume = Object.values(state.tipRack.wells)[0].totalLiquidVolume

  const volumeRange = { min: 1, max: Math.min(maxPipetteVolume, tipVolume) }
  const parsedMixVolume = parseNumericalInput(mixVolume, {
    allowDecimal: false,
    allowNegative: false,
    min: volumeRange.min,
    max: volumeRange.max,
  })
  const volumeErrorMessage =
    parsedMixVolume.result === 'rangeError'
      ? t('value_out_of_range', {
          min: parsedMixVolume.min,
          max: parsedMixVolume.max,
        })
      : parsedMixVolume.result === 'syntaxError'
        ? t('enter_a_valid_number')
        : null

  const repititionRange = { min: 1, max: 999 }
  const parsedMixReps = parseNumericalInput(mixReps, {
    allowDecimal: false,
    allowNegative: false,
    min: repititionRange.min,
    max: repititionRange.max,
  })
  const repititionErrorMessage =
    parsedMixReps.result === 'rangeError'
      ? t('value_out_of_range', {
          min: parsedMixReps.min,
          max: parsedMixReps.max,
        })
      : parsedMixReps.result === 'syntaxError'
        ? t('enter_a_valid_number')
        : null

  let buttonIsDisabled = false
  if (currentStep === 2) {
    buttonIsDisabled = parsedMixVolume.result !== 'success'
  } else if (currentStep === 3) {
    buttonIsDisabled = parsedMixReps.result !== 'success'
  }

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={
          kind === 'aspirate'
            ? t('mix_before_aspirating')
            : t('mix_after_dispensing')
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
            {t('mix_description')}
          </StyledText>

          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            {enableMixDisplayItems.map(displayItem => (
              <RadioButton
                key={displayItem.description}
                isSelected={mixIsEnabled === displayItem.option}
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
              autoFocus
              type="text"
              value={mixVolume}
              label={t('mix_volume_µL')}
              error={volumeErrorMessage}
              onChange={e => {
                setMixVolume(e.target.value)
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
              initialValue={mixVolume}
              onChange={setMixVolume}
            />
          </Flex>
        </Flex>
      ) : null}
      {currentStep === 3 ? (
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
              autoFocus
              type="text"
              value={mixReps}
              error={repititionErrorMessage}
              label={t('mix_repetitions')}
              onChange={e => {
                setMixReps(e.target.value)
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
              onChange={setMixReps}
            />
          </Flex>
        </Flex>
      ) : null}
    </Flex>,
    getTopPortalEl()
  )
}
