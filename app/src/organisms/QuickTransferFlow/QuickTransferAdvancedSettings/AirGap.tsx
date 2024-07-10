import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  POSITION_FIXED,
  COLORS,
  ALIGN_CENTER,
} from '@opentrons/components'
import { getTopPortalEl } from '../../../App/portal'
import { LargeButton } from '../../../atoms/buttons'
import { ChildNavigation } from '../../ChildNavigation'
import { InputField } from '../../../atoms/InputField'
import { ACTIONS } from '../constants'

import type {
  QuickTransferSummaryState,
  QuickTransferSummaryAction,
  FlowRateKind,
} from '../types'
import { i18n } from '../../../i18n'
import { NumericalKeyboard } from '../../../atoms/SoftwareKeyboard'

interface AirGapProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export function AirGap(props: AirGapProps): JSX.Element {
  const { kind, onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')
  const keyboardRef = React.useRef(null)

  const [selectedOption, setSelectedOption] = React.useState<string>('')
  const [currentStep, setCurrentStep] = React.useState<number>(0)
  const [volume, setVolume] = React.useState<number | null>(
    kind === 'aspirate'
      ? state.airGapAspirate ?? null
      : kind === 'dispense'
      ? state.airGapDispense ?? null
      : null
  )

  let headerCopy: string = ''
  let Action:
    | typeof ACTIONS.SET_AIR_GAP_ASPIRATE
    | typeof ACTIONS.SET_AIR_GAP_DISPENSE
    | null = null

  if (kind === 'aspirate') {
    headerCopy = t('air_gap_before_aspirating')
    Action = ACTIONS.SET_AIR_GAP_ASPIRATE
  } else if (kind === 'dispense') {
    headerCopy = t('air_gap_before_dispensing')
    Action = ACTIONS.SET_AIR_GAP_DISPENSE
  }

  const displayItems = [
    {
      option: 'Enabled',
      value: t('option_enabled'),
      onClick: () => {
        setSelectedOption('option_enabled')
      },
    },
    {
      option: 'Disabled',
      value: t('option_disabled'),
      onClick: () => {
        setSelectedOption('option_disabled')
      },
    },
  ]

  const flowSteps: string[] = ['enable_air_gap', 'select_volume']

  const handleClickBackOrExit = (): void => {
    currentStep > 0 ? setCurrentStep(currentStep - 1) : onBack()
  }

  const handleClickSaveOrContinue = (): void => {
    if (selectedOption === 'Enabled') {
      if (currentStep < flowSteps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        if (Action != null && volume != null) {
          dispatch({ type: Action, volume })
        }
        onBack()
      }
    } else {
      if (Action != null) {
        dispatch({ type: Action, volume: undefined })
      }
      onBack()
    }
  }

  const setSaveOrContinueButtonText = (): string => {
    return t(
      selectedOption === 'Enabled' && currentStep < flowSteps.length - 1
        ? 'shared:continue'
        : 'shared:save'
    )
  }
  const maxPipetteVolume = Object.values(state.pipette.liquids)[0].maxVolume
  const tipVolume = Object.values(state.tipRack.wells)[0].totalLiquidVolume

  // dispense air gap is performed whenever a tip is on its way to the trash, so
  // we can have the max be at the max tip capacity
  let maxAvailableCapacity = Math.min(maxPipetteVolume, tipVolume)

  // for aspirate, air gap behaves differently depending on the path
  if (kind === 'aspirate') {
    if (state.path === 'single') {
      // for a single path, air gap capacity is just the difference between the
      // pipette/tip capacity and the volume per well
      maxAvailableCapacity =
        Math.min(maxPipetteVolume, tipVolume) - state.volume
    } else if (state.path === 'multiAspirate') {
      // an aspirate air gap for multi aspirate will aspirate an air gap
      // after each aspirate action, so we need to halve the available capacity for single path
      // to get the amount available, assuming a min of 2 aspirates per dispense
      maxAvailableCapacity =
        (Math.min(maxPipetteVolume, tipVolume) - state.volume) / 2
    } else {
      // aspirate air gap for multi dispense occurs once per asprirate and
      // available volume is max capacity - volume*3 assuming a min of 2 dispenses
      // per aspirate plus 1x the volume for disposal
      maxAvailableCapacity =
        Math.min(maxPipetteVolume, tipVolume) - state.volume / 3
    }
  }

  const volumeRange = { min: 1, max: maxAvailableCapacity }
  const volumeError =
    volume !== null && (volume < volumeRange.min || volume > volumeRange.max)
      ? t(`value_out_of_range`, {
          min: volumeRange.min,
          max: volumeRange.max,
        })
      : null

  let buttonIsDisabled = selectedOption === ''
  if (flowSteps[currentStep] === 'select_volume') {
    buttonIsDisabled = volumeError != null || volume == null
  }

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={headerCopy}
        buttonText={i18n.format(setSaveOrContinueButtonText(), 'capitalize')}
        onClickBack={handleClickBackOrExit}
        onClickButton={handleClickSaveOrContinue}
        top={SPACING.spacing8}
        buttonIsDisabled={buttonIsDisabled}
      />
      {flowSteps[currentStep] === 'enable_air_gap' ? (
        <Flex
          marginTop={SPACING.spacing120}
          flexDirection={DIRECTION_COLUMN}
          padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
          gridGap={SPACING.spacing4}
          width="100%"
        >
          {displayItems.map(option => (
            <LargeButton
              key={option.option}
              buttonType={
                selectedOption === option.option ? 'primary' : 'secondary'
              }
              onClick={() => {
                setSelectedOption(option.option)
              }}
              buttonText={option.value}
            />
          ))}
        </Flex>
      ) : null}
      {flowSteps[currentStep] === 'select_volume' ? (
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
              value={volume}
              title={t('air_gap_volume_µL')}
              error={volumeError}
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
