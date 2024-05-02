import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, SPACING } from '@opentrons/components'

import { SmallButton } from '../../atoms/buttons'
import { ChildNavigation } from '../ChildNavigation'

import type {
  QuickTransferSetupState,
  QuickTransferWizardAction,
} from './types'

interface SelectSourceWellsProps {
  onNext: () => void
  onBack: () => void
  exitButtonProps: React.ComponentProps<typeof SmallButton>
  state: QuickTransferSetupState
  dispatch: React.Dispatch<QuickTransferWizardAction>
}

export function SelectSourceWells(props: SelectSourceWellsProps): JSX.Element {
  const { onNext, onBack, exitButtonProps, state, dispatch } = props
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])

  const handleClickNext = (): void => {
    // until well selection is implemented, select all wells and proceed to the next step
    if (state.source?.wells != null) {
      dispatch({
        type: 'SET_SOURCE_WELLS',
        wells: Object.keys(state.source.wells),
      })
      onNext()
    }
  }
  return (
    <Flex>
      <ChildNavigation
        header={t('select_source_wells')}
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
        TODO: Add source well selection deck map
      </Flex>
    </Flex>
  )
}
