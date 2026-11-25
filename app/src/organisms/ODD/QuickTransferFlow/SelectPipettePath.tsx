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
  PathOption,
  QuickTransferWizardAction,
  QuickTransferWizardState,
} from './types'

interface SelectPipettePathProps {
  onNext: () => void
  onBack: () => void
  exitButtonProps: ComponentProps<typeof SmallButton>
  state: QuickTransferWizardState
  dispatch: Dispatch<QuickTransferWizardAction>
}
export function SelectPipettePath({
  onNext,
  onBack,
  exitButtonProps,
  state,
  dispatch,
}: SelectPipettePathProps): ReactNode {
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const [selectedPath, setSelectedPath] = useState<PathOption | undefined>()

  const sourceWells = state.sourceWells ?? []
  const destinationWells = state.destinationWells ?? []

  // If the user is creating a 1:1 transfer or n:n transfer
  // If the user is creating a 1:n transfer, display options for single transfers and multi-dispense.
  // If the user is creating a n:1 transfer, display options for single transfers and multi-aspirate.
  const allowedPipettePathOptions: Array<{
    pathOption: PathOption
    description: string
  }> = [{ pathOption: 'single', description: t('pipette_path_single') }]
  if (sourceWells.length === 1 && destinationWells.length > 1) {
    allowedPipettePathOptions.push({
      pathOption: 'multiDispense',
      description: t('distribute'),
    })
  }
  if (sourceWells.length > 1 && destinationWells.length === 1) {
    allowedPipettePathOptions.push({
      pathOption: 'multiAspirate',
      description: t('consolidate'),
    })
  }

  const handleClickNext = (): void => {
    dispatch({
      type: ACTIONS.SET_PIPETTE_PATH,
      path: selectedPath ?? 'single',
    })
    onNext()
  }

  return (
    <Flex>
      <ChildNavigation
        header={t('select_pipette_path')}
        buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        onClickBack={onBack}
        onClickButton={handleClickNext}
        secondaryButtonProps={exitButtonProps}
        top={SPACING.spacing8}
        buttonIsDisabled={selectedPath == null}
      />
      <Flex
        marginTop={SPACING.spacing120}
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing32} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
        gridGap={SPACING.spacing8}
        width="100%"
      >
        {allowedPipettePathOptions.map(option => (
          <RadioButton
            key={option.description}
            isSelected={selectedPath === option.pathOption}
            onChange={() => {
              setSelectedPath(option.pathOption)
            }}
            buttonValue={option.description}
            buttonLabel={option.description}
            radioButtonType="large"
          />
        ))}
      </Flex>
    </Flex>
  )
}
