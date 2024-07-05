import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  POSITION_FIXED,
  COLORS,
} from '@opentrons/components'
import { getTopPortalEl } from '../../../App/portal'
import { LargeButton } from '../../../atoms/buttons'
import { ChildNavigation } from '../../ChildNavigation'
import { ACTIONS } from '../constants'

import type {
  QuickTransferSummaryState,
  QuickTransferSummaryAction,
  FlowRateKind,
  BlowOutLocation,
} from '../types'
import { i18n } from '../../../i18n'

interface BlowOutProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export function BlowOut(props: BlowOutProps): JSX.Element {
  const { onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')

  const [selectedOption, setSelectedOption] = React.useState<string>('')
  const [currentStep, setCurrentStep] = React.useState<number>(0)
  const [blowOutLocation, setBlowOutLocation] = React.useState<string>(
    state.blowOut ?? 'trashBin'
  )

  const Action = ACTIONS.SET_BLOW_OUT
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

  const blowOutLocationItems = [
    { option: 'trashBin', value: t('blow_out_trash_bin') },
    { option: 'wasteChute', value: t('blow_out_waste_chute') },
    { option: 'source_well', value: t('blow_out_source_well') },
    { option: 'dest_well', value: t('blow_out_destination_well') },
  ]

  const flowSteps: string[] = ['enable_blowout', 'select_location']

  const handleClickBackOrExit = (): void => {
    currentStep > 0 ? setCurrentStep(currentStep - 1) : onBack()
  }

  const handleClickSaveOrContinue = (): void => {
    if (selectedOption === 'Enabled') {
      if (currentStep < flowSteps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        if (Action != null && blowOutLocation != null) {
          dispatch({
            type: Action,
            location: blowOutLocation as BlowOutLocation,
          })
        }
        onBack()
      }
    } else {
      if (Action != null) {
        dispatch({ type: Action, location: undefined })
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

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={t('blow_out_after_dispensing')}
        buttonText={i18n.format(setSaveOrContinueButtonText(), 'capitalize')}
        onClickBack={handleClickBackOrExit}
        onClickButton={handleClickSaveOrContinue}
        top={SPACING.spacing8}
        buttonIsDisabled={selectedOption === ''}
      />
      {flowSteps[currentStep] === 'enable_blowout' ? (
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
      {flowSteps[currentStep] === 'select_location' ? (
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
