import * as React from 'react'
import { useTranslation } from 'react-i18next'
import without from 'lodash/without'
import {
  Flex,
  JUSTIFY_CENTER,
  POSITION_FIXED,
  SPACING,
} from '@opentrons/components'

import { ChildNavigation } from '../../organisms/ChildNavigation'
import { WellSelection } from '../../organisms/WellSelection'

import type { SmallButton } from '../../atoms/buttons'
import type {
  QuickTransferWizardState,
  QuickTransferWizardAction,
} from './types'

interface SelectSourceWellsProps {
  onNext: () => void
  onBack: () => void
  state: QuickTransferWizardState
  dispatch: React.Dispatch<QuickTransferWizardAction>
}

export function SelectSourceWells(props: SelectSourceWellsProps): JSX.Element {
  const { onNext, onBack, state, dispatch } = props
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])

  const sourceWells = state.sourceWells ?? []
  const sourceWellGroup = sourceWells.reduce((acc, well) => {
    return { ...acc, [well]: null }
  }, {})

  const [selectedWells, setSelectedWells] = React.useState(sourceWellGroup)

  const handleClickNext = (): void => {
    dispatch({
      type: 'SET_SOURCE_WELLS',
      wells: Object.keys(selectedWells),
    })
    onNext()
  }

  const resetButtonProps: React.ComponentProps<typeof SmallButton> = {
    buttonType: 'tertiaryLowLight',
    buttonText: t('shared:reset'),
    onClick: () => {
      setSelectedWells({})
    },
  }

  return (
    <>
      <ChildNavigation
        header={t('select_source_wells')}
        onClickBack={onBack}
        buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        onClickButton={handleClickNext}
        buttonIsDisabled={Object.keys(selectedWells).length === 0}
        secondaryButtonProps={resetButtonProps}
        top={SPACING.spacing8}
      />
      <Flex
        justifyContent={JUSTIFY_CENTER}
        marginTop={SPACING.spacing120}
        padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
        position={POSITION_FIXED}
        top="0"
        left="0"
        width="100%"
      >
        {state.source != null ? (
          <WellSelection
            definition={state.source}
            deselectWells={(wells: string[]) => {
              setSelectedWells(prevWells =>
                without(Object.keys(prevWells), ...wells).reduce(
                  (acc, well) => {
                    return { ...acc, [well]: null }
                  },
                  {}
                )
              )
            }}
            selectedPrimaryWells={selectedWells}
            selectWells={wellGroup => {
              setSelectedWells(prevWells => ({ ...prevWells, ...wellGroup }))
            }}
            channels={state.pipette?.channels ?? 1}
          />
        ) : null}
      </Flex>
    </>
  )
}
