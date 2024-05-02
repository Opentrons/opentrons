import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, SPACING } from '@opentrons/components'

import { SmallButton } from '../../atoms/buttons'
import { ChildNavigation } from '../ChildNavigation'

import type {
  QuickTransferSetupState,
  QuickTransferWizardAction,
} from './types'

interface SelectDestWellsProps {
  onNext: () => void
  onBack: () => void
  exitButtonProps: React.ComponentProps<typeof SmallButton>
  state: QuickTransferSetupState
  dispatch: React.Dispatch<QuickTransferWizardAction>
}

export function SelectDestWells(props: SelectDestWellsProps): JSX.Element {
  const { onNext, onBack, exitButtonProps, state, dispatch } = props
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])

  const handleClickNext = (): void => {
    // until well selection is implemented, select all wells and proceed to the next step
    if (state.destination === 'source' && state.source != null) {
      dispatch({
        type: 'SET_DEST_WELLS',
        wells: Object.keys(state.source.wells),
      })
    } else if (state.destination != 'source' && state.destination != null) {
      dispatch({
        type: 'SET_DEST_WELLS',
        wells: Object.keys(state.destination.wells),
      })
    }
    onNext()
  }
  return (
    <Flex>
      <ChildNavigation
        header={t('select_dest_wells')}
        onClickBack={onBack}
        buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        onClickButton={handleClickNext}
        buttonIsDisabled={false}
        secondaryButtonProps={exitButtonProps}
        top={SPACING.spacing8}
      />
      <Flex
        marginTop={SPACING.spacing120}
        padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
      >
        TODO: Add destination well selection deck map
      </Flex>
    </Flex>
  )
}
