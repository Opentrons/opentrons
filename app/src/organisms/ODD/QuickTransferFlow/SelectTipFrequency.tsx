import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
} from '@opentrons/components'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import { ACTIONS } from './constants'

import type { ComponentProps, Dispatch, ReactNode } from 'react'
import type { SmallButton } from '/app/atoms/buttons'
import type {
  ChangeTipOptions,
  QuickTransferWizardAction,
  QuickTransferWizardState,
} from './types'

interface SelectTipFrequencyProps {
  onNext: () => void
  onBack: () => void
  exitButtonProps: ComponentProps<typeof SmallButton>
  state: QuickTransferWizardState
  dispatch: Dispatch<QuickTransferWizardAction>
}
export function SelectTipFrequency({
  onNext,
  onBack,
  exitButtonProps,
  state,
  dispatch,
}: SelectTipFrequencyProps): ReactNode {
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const [selectedChangeTipOption, setSelectedChangeTipOption] =
    useState<ChangeTipOptions>()

  const allowedChangeTipOptions: ChangeTipOptions[] = ['once']
  if (
    state.sourceWells !== undefined &&
    state.pipette !== undefined &&
    state.destinationWells !== undefined
  ) {
    if (
      state.sourceWells.length * state.pipette.channels <= 96 &&
      state.destinationWells.length * state.pipette.channels <= 96
    ) {
      allowedChangeTipOptions.push('always')
    }
  }

  if (
    state.path === 'single' &&
    state.transferType === 'distribute' &&
    state.destinationWells !== undefined
  ) {
    if (state.destinationWells.length <= 96) {
      allowedChangeTipOptions.push('perDest')
    }
  } else if (state.path === 'single' && state.sourceWells !== undefined) {
    if (state.sourceWells.length <= 96) {
      allowedChangeTipOptions.push('perSource')
    }
  }

  const handleClickNext = (): void => {
    dispatch({
      type: ACTIONS.SET_CHANGE_TIP,
      changeTip: selectedChangeTipOption ?? 'once',
    })
    onNext()
  }

  return (
    <Flex>
      <ChildNavigation
        header={t('select_change_tip_frequency')}
        buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        onClickBack={onBack}
        onClickButton={handleClickNext}
        secondaryButtonProps={exitButtonProps}
        top={SPACING.spacing8}
        buttonIsDisabled={selectedChangeTipOption == null}
      />
      <Flex
        marginTop={SPACING.spacing120}
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing32} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
        gridGap={SPACING.spacing8}
        width="100%"
      >
        {allowedChangeTipOptions.map(option => (
          <RadioButton
            key={option}
            isSelected={selectedChangeTipOption === option}
            onChange={() => {
              setSelectedChangeTipOption(option)
            }}
            buttonValue={option}
            buttonLabel={t(`${option}`)}
          />
        ))}
      </Flex>
    </Flex>
  )
}
