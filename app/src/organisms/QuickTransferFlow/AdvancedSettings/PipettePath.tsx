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

import type {
  PathOption,
  QuickTransferSummaryState,
  QuickTransferSummaryAction,
} from '../types'

interface PipettePathProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
}

export function PipettePath(props: PipettePathProps): JSX.Element {
  const { onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')

  const allowedPipettePathOptions: PathOption[] = ['single']
  if (state.sourceWells.length === 1 && state.destinationWells.length > 1) {
    allowedPipettePathOptions.push('multiDispense')
  } else if (state.sourceWells.length > 1  && state.destinationWells.length === 1) {
    allowedPipettePathOptions.push('multiAspirate')
  }
  const [
    selectedPipettePathOption,
    setSelectedPipettePathOption,
  ] = React.useState<PathOption>(state.path)

  // TODO: set the user facing option here
  const handleClickSave = (): void => {
    if (selectedPipettePathOption !== state.path) {
      dispatch({
        type: 'SET_PIPETTE_PATH',
        path: selectedPipettePathOption,
      })
    }
    onBack()
  }
  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={t('pipette_path')}
        buttonText={t('save')}
        onClickBack={onBack}
        onClickButton={handleClickSave}
        buttonIsDisabled={selectedPipettePathOption == null}
      />
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
            buttonType={
              selectedPipettePathOption === option ? 'primary' : 'secondary'
            }
            onClick={() => {
              setSelectedPipettePathOption(option)
            }}
            buttonText={t(`${option}`)}
          />
        ))}
      </Flex>
    </Flex>,
    getTopPortalEl()
  )
}
