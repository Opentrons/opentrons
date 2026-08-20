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
import {
  getAspirateAirGapVolumeRange,
  getDispenseAirGapVolumeRange,
} from '../utils'

import type { Dispatch } from 'react'
import type {
  FlowRateKind,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface AirGapProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export function AirGap(props: AirGapProps): JSX.Element {
  const { kind, onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const keyboardRef = useRef(null)

  const [airGapEnabled, setAirGapEnabled] = useState<boolean>(
    kind === 'aspirate'
      ? state.airGapAspirate != null
      : state.airGapDispense != null
  )
  const [currentStep, setCurrentStep] = useState<number>(1)
  const existingVolume =
    kind === 'aspirate' ? state.airGapAspirate : state.airGapDispense
  const [volume, setVolume] = useState<string>(
    existingVolume != null ? String(existingVolume) : ''
  )

  const action =
    kind === 'aspirate'
      ? ACTIONS.SET_AIR_GAP_ASPIRATE
      : ACTIONS.SET_AIR_GAP_DISPENSE

  const enableAirGapDisplayItems = [
    {
      option: true,
      description: t('option_enabled'),
      onClick: () => {
        setAirGapEnabled(true)
      },
    },
    {
      option: false,
      description: t('option_disabled'),
      onClick: () => {
        setAirGapEnabled(false)
      },
    },
  ]

  const handleClickBackOrExit = (): void => {
    currentStep > 1 ? setCurrentStep(currentStep - 1) : onBack()
  }

  const handleClickSaveOrContinue = (): void => {
    if (currentStep === 1) {
      if (airGapEnabled) {
        setCurrentStep(currentStep + 1)
      } else {
        dispatch({ type: action, volume: undefined })
        trackEventWithRobotSerial({
          name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
          properties: {
            setting: `AirGap_${kind}`,
          },
        })
        onBack()
      }
    } else if (currentStep === 2) {
      if (parsedVolume.result === 'success') {
        dispatch({ type: action, volume: parsedVolume.data })
        trackEventWithRobotSerial({
          name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
          properties: {
            setting: `AirGap_${kind}`,
          },
        })
        onBack()
      }
    }
  }

  const setSaveOrContinueButtonText =
    airGapEnabled && currentStep < 2 ? t('shared:continue') : t('shared:save')

  const volumeRange =
    kind === 'aspirate'
      ? getAspirateAirGapVolumeRange(state.pipette, state.tipRack)
      : getDispenseAirGapVolumeRange(
          state.volume,
          state?.disposalVolumeDispenseSettings?.volume ?? 0,
          state.path,
          state.pipette,
          state.tipRack
        )

  const parsedVolume = parseNumericalInput(volume, {
    allowDecimal: false,
    allowNegative: false,
    min: volumeRange.min,
    max: volumeRange.max,
  })
  const isVolumeRangeEmpty = volumeRange.min > volumeRange.max

  let volumeErrorMessage = null
  if (parsedVolume.result === 'syntaxError') {
    volumeErrorMessage = t('enter_a_valid_number')
  } else if (isVolumeRangeEmpty) {
    volumeErrorMessage = t('air_gap_capacity_error')
  } else if (parsedVolume.result === 'rangeError') {
    volumeErrorMessage = t('value_out_of_range', {
      min: parsedVolume.min,
      max: parsedVolume.max,
    })
  }

  let buttonIsDisabled = false
  if (currentStep === 2) {
    buttonIsDisabled = isVolumeRangeEmpty || parsedVolume.result !== 'success'
  }

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={
          kind === 'aspirate'
            ? t('air_gap_after_aspirating')
            : t('air_gap_after_dispensing')
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
              ? t('air_gap_description_aspirate')
              : t('air_gap_description_dispense')}
          </StyledText>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            {enableAirGapDisplayItems.map(displayItem => (
              <RadioButton
                key={displayItem.description}
                isSelected={airGapEnabled === displayItem.option}
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
              value={volume}
              label={t('air_gap_volume_µL')}
              error={volumeErrorMessage}
              onChange={e => {
                setVolume(e.target.value)
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
