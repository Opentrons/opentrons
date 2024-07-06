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

import type {
  PathOption,
  QuickTransferSummaryState,
  QuickTransferSummaryAction,
  BlowOutLocation,
} from '../types'
import { ACTIONS } from '../constants'
import { i18n } from '../../../i18n'
import { InputField } from '../../../atoms/InputField'
import { NumericalKeyboard } from '../../../atoms/SoftwareKeyboard'

interface PipettePathProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
}

export function PipettePath(props: PipettePathProps): JSX.Element {
  const { onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')
  const keyboardRef = React.useRef(null)

  const [selectedOption, setSelectedOption] = React.useState<PathOption>(
    state.path
  )
  const [currentStep, setCurrentStep] = React.useState<number>(0)
  const [blowOutLocation, setBlowOutLocation] = React.useState<string>(
    state.blowOut ?? 'trashBin'
  )
  const [volume, setVolume] = React.useState<number>(state.volume)

  const allowedPipettePathOptions: PathOption[] = ['single']
  if (state.sourceWells.length === 1 && state.destinationWells.length > 1) {
    allowedPipettePathOptions.push('multiDispense')
  } else if (
    state.sourceWells.length > 1 &&
    state.destinationWells.length === 1
  ) {
    allowedPipettePathOptions.push('multiAspirate')
  }

  function getOptionCopy(option: PathOption): string {
    switch (option) {
      case 'single':
        return t('pipette_path_single')
      case 'multiAspirate':
        return t('pipette_path_multi_aspirate')
      case 'multiDispense':
        return t('pipette_path_multi_dispense')
      default:
        return ''
    }
  }

  const blowOutLocationItems = [
    { option: 'trashBin', value: t('blow_out_trash_bin') },
    { option: 'wasteChute', value: t('blow_out_waste_chute') },
    { option: 'source_well', value: t('blow_out_source_well') },
    { option: 'dest_well', value: t('blow_out_destination_well') },
  ]

  const flowSteps: string[] = ['select_path', 'select_volume', 'select_blowout']

  const handleClickBackOrExit = (): void => {
    currentStep > 0 ? setCurrentStep(currentStep - 1) : onBack()
  }

  const handleClickSaveOrContinue = (): void => {
    if (selectedOption === 'multiAspirate') {
      if (currentStep < flowSteps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        console.log({ selectedOption, volume, blowOutLocation })
        if (blowOutLocation != null && volume != null) {
          dispatch({
            type: ACTIONS.SET_PIPETTE_PATH,
            path: selectedOption as PathOption,
          })
          dispatch({
            type: ACTIONS.SET_BLOW_OUT,
            location: blowOutLocation as BlowOutLocation,
          })
          dispatch({ type: ACTIONS.SET_VOLUME, volume })
        }
        onBack()
      }
    } else {
      dispatch({ type: ACTIONS.SET_PIPETTE_PATH, path: selectedOption })
      onBack()
    }
  }

  const setSaveOrContinueButtonText = (): string => {
    return t(
      selectedOption === 'multiAspirate' && currentStep < flowSteps.length - 1
        ? 'shared:continue'
        : 'shared:save'
    )
  }

  // TODO: find the actual min and max for these values.
  const volumeRange = { min: 1, max: 100 }
  const error =
    volume !== null && (volume < volumeRange.min || volume > volumeRange.max)
      ? t(`value_out_of_range`, {
          min: volumeRange.min,
          max: volumeRange.max,
        })
      : null

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={t('pipette_path')}
        buttonText={i18n.format(setSaveOrContinueButtonText(), 'capitalize')}
        onClickBack={handleClickBackOrExit}
        onClickButton={handleClickSaveOrContinue}
        buttonIsDisabled={selectedOption === null}
      />
      {flowSteps[currentStep] === 'select_path' ? (
        <Flex
          marginTop={SPACING.spacing120}
          flexDirection={DIRECTION_COLUMN}
          padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
          gridGap={SPACING.spacing4}
          width="100%"
        >
          {allowedPipettePathOptions.map(option => (
            <LargeButton
              key={option}
              buttonType={selectedOption === option ? 'primary' : 'secondary'}
              onClick={() => {
                setSelectedOption(option)
              }}
              buttonText={getOptionCopy(option)}
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
              title={t('disposal_volume_µL')}
              error={error}
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
      {flowSteps[currentStep] === 'select_blowout' ? (
        <Flex
          marginTop={SPACING.spacing120}
          flexDirection={DIRECTION_COLUMN}
          padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
          gridGap={SPACING.spacing4}
          width="100%"
        >
          {blowOutLocationItems.map(option => (
            <LargeButton
              key={option.option}
              buttonType={
                blowOutLocation === option.option ? 'primary' : 'secondary'
              }
              onClick={() => {
                setBlowOutLocation(option.option)
              }}
              buttonText={option.value}
            />
          ))}
        </Flex>
      ) : null}
    </Flex>,
    getTopPortalEl()
  )
}
