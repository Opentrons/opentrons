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
  const [volume, setVolume] = useState<number | null>(
    kind === 'aspirate'
      ? (state.airGapAspirate ?? null)
      : (state.airGapDispense ?? null)
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
      dispatch({ type: action, volume: volume ?? undefined })
      trackEventWithRobotSerial({
        name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
        properties: {
          setting: `AirGap_${kind}`,
        },
      })
      onBack()
    }
  }

  const setSaveOrContinueButtonText =
    airGapEnabled && currentStep < 2 ? t('shared:continue') : t('shared:save')

  const { min, max } =
    kind === 'aspirate'
      ? getAspirateAirGapVolumeRange(state.pipette, state.tipRack)
      : getDispenseAirGapVolumeRange(
          state.volume,
          state?.disposalVolumeDispenseSettings?.volume ?? 0,
          state.path,
          state.pipette,
          state.tipRack
        )

  const volumeRange = { min, max }
  let volumeError = null
  if (volumeRange.min > volumeRange.max) {
    volumeError = t('air_gap_capacity_error')
  } else if (
    volume !== null &&
    (volume < volumeRange.min || volume > volumeRange.max)
  ) {
    volumeError = t(`value_out_of_range`, {
      min: volumeRange.min,
      max: volumeRange.max,
    })
  }

  let buttonIsDisabled = false
  if (currentStep === 2) {
    buttonIsDisabled = volume == null || volumeError != null
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
              type="number"
              value={volume}
              label={t('air_gap_volume_µL')}
              error={volumeError}
              onChange={e => {
                setVolume(Number(e.target.value))
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
              initialValue={String(volume ?? '')}
              onChange={e => {
                setVolume(Number(e))
              }}
            />
          </Flex>
        </Flex>
      ) : null}
    </Flex>,
    getTopPortalEl()
  )
}
