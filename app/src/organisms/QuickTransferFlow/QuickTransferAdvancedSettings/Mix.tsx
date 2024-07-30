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

interface MixProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export function Mix(props: MixProps): JSX.Element {
  const { kind, onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')
  const keyboardRef = React.useRef(null)

  const [mixIsEnabled, setMixIsEnabled] = React.useState<boolean>(
    kind === 'aspirate'
      ? state.mixOnAspirate != null
      : state.mixOnDispense != null
  )
  const [currentStep, setCurrentStep] = React.useState<number>(1)
  const [mixVolume, setMixVolume] = React.useState<number | null>(
    kind === 'aspirate'
      ? state.mixOnAspirate?.mixVolume ?? null
      : state.mixOnDispense?.mixVolume ?? null
  )
  const [mixReps, setMixReps] = React.useState<number | null>(
    kind === 'aspirate'
      ? state.mixOnAspirate?.repititions ?? null
      : state.mixOnDispense?.repititions ?? null
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
    if (currentStep === 1) {
      if (!mixIsEnabled) {
        dispatch({
          type: mixAction,
          mixSettings: undefined,
        })
      } else {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      setCurrentStep(3)
    } else if (currentStep === 3) {
      if (mixVolume != null && mixReps != null) {
        dispatch({
          type: mixAction,
          mixSettings: { mixVolume, repititions: mixReps },
        })
      }
      onBack()
    }
  }

  const setSaveOrContinueButtonText =
    mixIsEnabled && currentStep < 3 ? t('shared:continue') : t('shared:save')

  const maxPipetteVolume = Object.values(state.pipette.liquids)[0].maxVolume
  const tipVolume = Object.values(state.tipRack.wells)[0].totalLiquidVolume

  const volumeRange = { min: 1, max: Math.min(maxPipetteVolume, tipVolume) }
  const volumeError =
    mixVolume != null &&
    (mixVolume < volumeRange.min || mixVolume > volumeRange.max)
      ? t(`value_out_of_range`, {
          min: volumeRange.min,
          max: volumeRange.max,
        })
      : null

  let buttonIsDisabled = false
  if (currentStep === 2) {
    buttonIsDisabled = mixVolume == null || volumeError != null
  } else if (currentStep === 3) {
    buttonIsDisabled = mixReps == null
  }

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={
          kind === 'aspirate'
            ? t('mix_before_aspirating')
            : t('mix_before_dispensing')
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
          gridGap={SPACING.spacing4}
          width="100%"
        >
          {enableMixDisplayItems.map(displayItem => (
            <LargeButton
              key={displayItem.description}
              buttonType={
                mixIsEnabled === displayItem.option ? 'primary' : 'secondary'
              }
              onClick={displayItem.onClick}
              buttonText={displayItem.description}
            />
          ))}
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
              value={mixVolume}
              title={t('mix_volume_µL')}
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
                setMixVolume(Number(e))
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
            gridGap={SPACING.spacing24}
            flexDirection={DIRECTION_COLUMN}
            marginTop={SPACING.spacing68}
          >
            <InputField
              type="number"
              value={mixReps}
              title={t('mix_repetitions')}
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
                setMixReps(Number(e))
              }}
            />
          </Flex>
        </Flex>
      ) : null}
    </Flex>,
    getTopPortalEl()
  )
}
