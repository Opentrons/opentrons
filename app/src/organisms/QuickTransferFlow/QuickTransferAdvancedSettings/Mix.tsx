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
  PathOption,
  QuickTransferSummaryState,
  QuickTransferSummaryAction,
  FlowRateKind,
} from '../types'

interface MixProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export function Mix(props: MixProps): JSX.Element {
  const { kind, onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')

  let headerCopy = ''
  let textEntryCopy = ''
  let MixAction:
    | typeof ACTIONS.SET_ASPIRATE_FLOW_RATE
    | typeof ACTIONS.SET_DISPENSE_FLOW_RATE
    | null = null
 
  if (kind === 'aspirate') {
    headerCopy = t('aspirate_flow_rate')
    textEntryCopy = t('aspirate_flow_rate_µL')
    MixAction = ACTIONS.SET_ASPIRATE_FLOW_RATE
  } else if (kind === 'dispense') {
    headerCopy = t('dispense_flow_rate')
    textEntryCopy = t('dispense_flow_rate_µL')
    MixAction = ACTIONS.SET_DISPENSE_FLOW_RATE
  }

  const allowedPipettePathOptions: PathOption[] = ['single']
  if (state.sourceWells.length === 1 && state.destinationWells.length > 1) {
    allowedPipettePathOptions.push('multiDispense')
  } else if (
    state.sourceWells.length > 1 &&
    state.destinationWells.length === 1
  ) {
    allowedPipettePathOptions.push('multiAspirate')
  }
  const [
    selectedPipettePathOption,
    setSelectedPipettePathOption,
  ] = React.useState<PathOption>(state.path)

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
            buttonText={getOptionCopy(option)}
          />
        ))}
      </Flex>
    </Flex>,
    getTopPortalEl()
  )
}
