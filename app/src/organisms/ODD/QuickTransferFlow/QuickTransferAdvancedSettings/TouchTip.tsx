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
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { ANALYTICS_QUICK_TRANSFER_SETTING_SAVED } from '/app/redux/analytics'

import { ACTIONS } from '../constants'

import type { Dispatch, ReactNode } from 'react'
import type {
  FlowRateKind,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface TouchTipProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export function TouchTip(props: TouchTipProps): ReactNode {
  const { kind, onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const keyboardRef = useRef(null)

  const [touchTipIsEnabled, setTouchTipIsEnabled] = useState<boolean>(
    kind === 'aspirate'
      ? state.touchTipAspirate != null
      : state.touchTipDispense != null
  )
  const initialSpeed =
    kind === 'aspirate'
      ? state.touchTipAspirateSpeed
      : state.touchTipDispenseSpeed
  const [speed, setSpeed] = useState<number | null>(initialSpeed ?? null)
  const [currentStep, setCurrentStep] = useState<number>(1)
  const touchTipAspirate =
    state.touchTipAspirate != null ? state.touchTipAspirate.toString() : null
  const touchTipDispense =
    state.touchTipDispense != null ? state.touchTipDispense.toString() : null
  const [position, setPosition] = useState<string | null>(
    kind === 'aspirate' ? touchTipAspirate : touchTipDispense
  )

  const touchTipAction =
    kind === 'aspirate'
      ? ACTIONS.SET_TOUCH_TIP_ASPIRATE
      : ACTIONS.SET_TOUCH_TIP_DISPENSE

  const enableTouchTipDisplayItems = [
    {
      option: true,
      description: t('option_enabled'),
      onClick: () => {
        setTouchTipIsEnabled(true)
      },
    },
    {
      option: false,
      description: t('option_disabled'),
      onClick: () => {
        setTouchTipIsEnabled(false)
      },
    },
  ]

  const handleClickBackOrExit = (): void => {
    currentStep > 1 ? setCurrentStep(currentStep - 1) : onBack()
  }

  const handleClickSaveOrContinue = (): void => {
    if (currentStep === 1) {
      if (!touchTipIsEnabled) {
        dispatch({ type: touchTipAction, position: undefined })
        trackEventWithRobotSerial({
          name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
          properties: {
            setting: `TouchTip_${kind}`,
          },
        })
        onBack()
      } else {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      setCurrentStep(3)
    } else if (currentStep === 3) {
      dispatch({
        type: touchTipAction,
        position: position != null ? parseInt(position) : undefined,
        [kind === 'aspirate'
          ? 'touchTipAspirateSpeed'
          : 'touchTipDispenseSpeed']: speed,
      })
      trackEventWithRobotSerial({
        name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
        properties: {
          setting: `TouchTip_${kind}`,
        },
      })
      onBack()
    }
  }

  const setSaveOrContinueButtonText =
    touchTipIsEnabled && currentStep < 3
      ? t('shared:continue')
      : t('shared:save')

  let wellHeight = 1
  if (kind === 'aspirate') {
    wellHeight = Math.max(
      ...state.sourceWells.map(well =>
        state.source !== null ? state.source.wells[well].depth : 0
      )
    )
  } else if (kind === 'dispense') {
    const destLabwareDefinition =
      state.destination === 'source' ? state.source : state.destination
    wellHeight = Math.max(
      ...state.destinationWells.map(well =>
        destLabwareDefinition !== null
          ? destLabwareDefinition.wells[well].depth
          : 0
      )
    )
  }

  // the allowed range for touch tip is half the height of the well to 1x the height
  const positionRange = { min: -Math.round(wellHeight / 2), max: 0 }
  const positionError =
    position !== null &&
    (position === '-' ||
      position.indexOf('-') !== position.lastIndexOf('-') ||
      Number(position) < positionRange.min ||
      Number(position) > positionRange.max)
      ? t(`value_out_of_range`, {
          min: positionRange.min,
          max: Math.floor(positionRange.max),
        })
      : null

  let buttonIsDisabled = false
  if (currentStep === 2) {
    buttonIsDisabled = speed == null
  }
  if (currentStep === 3) {
    buttonIsDisabled = position == null || positionError != null
  }

  const handleSpeedChange = (userInput: string): void => {
    if (userInput === '') {
      setSpeed(null)
    }
    const parsedSpeed = parseInt(userInput)
    setSpeed(!isNaN(parsedSpeed) ? parsedSpeed : null)
  }

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={
          kind === 'aspirate'
            ? t('touch_tip_after_aspirating')
            : t('touch_tip_after_dispensing')
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
              ? t('touch_tip_description_aspirating')
              : t('touch_tip_description_dispensing')}
          </StyledText>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            {enableTouchTipDisplayItems.map(displayItem => (
              <RadioButton
                key={displayItem.description}
                isSelected={touchTipIsEnabled === displayItem.option}
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
              value={String(speed ?? '')}
              label={t('speed')}
              onChange={e => {
                handleSpeedChange(e.target.value as string)
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
              initialValue={String(speed ?? '')}
              onChange={e => {
                handleSpeedChange(e)
              }}
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
            gridGap={SPACING.spacing8}
            flexDirection={DIRECTION_COLUMN}
            marginTop={SPACING.spacing68}
          >
            <TouchInputField
              autoFocus
              type="text"
              value={String(position ?? '')}
              label={t('touch_tip_position_mm')}
              error={positionError}
              onChange={e => {
                setPosition(e.target.value as string)
              }}
            />
            <StyledText oddStyle="bodyTextRegular" color={COLORS.grey60}>
              {t('touch_tip_from_top', {
                min: positionRange.min,
                max: positionRange.max,
              })}
            </StyledText>
          </Flex>
          <Flex
            paddingX={SPACING.spacing24}
            height="21.25rem"
            marginTop="7.75rem"
            borderRadius="0"
          >
            <NumericalKeyboard
              hasHyphen
              keyboardRef={keyboardRef}
              initialValue={String(position ?? '')}
              onChange={e => {
                setPosition(e)
              }}
            />
          </Flex>
        </Flex>
      ) : null}
    </Flex>,
    getTopPortalEl()
  )
}
