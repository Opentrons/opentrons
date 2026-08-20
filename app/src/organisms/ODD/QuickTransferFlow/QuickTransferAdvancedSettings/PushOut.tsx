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
import { getMaxPushOutVolume } from '@opentrons/shared-data'

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

interface PushOutProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export function PushOut(props: PushOutProps): JSX.Element {
  const { kind, onBack, state, dispatch } = props
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const keyboardRef = useRef(null)
  const [pushOutIsEnabled, setPushOutIsEnabled] = useState<boolean | null>(
    state.pushOutDispense?.volume != null
  )
  const [volume, setVolume] = useState<string>(
    state.pushOutDispense?.volume != null
      ? String(state.pushOutDispense.volume)
      : ''
  )
  const [currentStep, setCurrentStep] = useState<number>(1)

  const enablePreWetTipDisplayItems = [
    {
      option: true,
      description: t('option_enabled'),
      onClick: () => {
        setPushOutIsEnabled(true)
      },
    },
    {
      option: false,
      description: t('option_disabled'),
      onClick: () => {
        setPushOutIsEnabled(false)
      },
    },
  ]

  const setSaveOrContinueButtonText =
    pushOutIsEnabled && currentStep < 2
      ? t('shared:continue')
      : t('shared:save')

  const handleClickBackOrExit = onBack

  const handleClickSaveOrContinue = (): void => {
    if (currentStep === 1) {
      if (!pushOutIsEnabled) {
        dispatch({
          type: ACTIONS.SET_PUSH_OUT,
          pushOutSettings: undefined,
        })
        trackEventWithRobotSerial({
          name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
          properties: {
            setting: `Push-out_${kind}`,
          },
        })
        onBack()
      } else {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      if (parsedVolume.result === 'success') {
        dispatch({
          type: ACTIONS.SET_PUSH_OUT,
          pushOutSettings: {
            volume: parsedVolume.data,
          },
        })
        trackEventWithRobotSerial({
          name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
          properties: {
            setting: `Push-out_${kind}`,
          },
        })
      }
      onBack()
    }
  }

  const pushOutMaxVolume = getMaxPushOutVolume(state.volume, state.pipette)
  const parsedVolume = parseNumericalInput(volume, {
    allowDecimal: true,
    allowNegative: false,
    min: 0,
    max: pushOutMaxVolume,
  })
  let buttonIsDisabled = false
  if (currentStep === 2) {
    buttonIsDisabled = parsedVolume.result !== 'success'
  }

  const volumeErrorMessage =
    parsedVolume.result === 'rangeError'
      ? t('value_out_of_range', {
          min: parsedVolume.min,
          max: parsedVolume.max,
        })
      : parsedVolume.result === 'syntaxError'
        ? t('enter_a_valid_number')
        : null

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={t('push_out_after_dispensing')}
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
            {t('push_out_description')}
          </StyledText>

          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            {enablePreWetTipDisplayItems.map(displayItem => (
              <RadioButton
                key={displayItem.description}
                isSelected={pushOutIsEnabled === displayItem.option}
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
          marginTop="7.75rem"
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
              value={volume}
              error={volumeErrorMessage}
              label={t('push_out_volume')}
              onChange={e => {
                setVolume(e.target.value)
              }}
            />
          </Flex>
          <Flex
            paddingX={SPACING.spacing24}
            height="21.25rem"
            marginTop="7.75rem"
          >
            <NumericalKeyboard
              keyboardRef={keyboardRef}
              isDecimal
              initialValue={volume}
              onChange={setVolume}
            />
          </Flex>
        </Flex>
      ) : null}
    </Flex>,
    getTopPortalEl()
  )
}
