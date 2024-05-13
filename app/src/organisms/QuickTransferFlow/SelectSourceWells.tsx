import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, JUSTIFY_CENTER, SPACING } from '@opentrons/components'

import { ChildNavigation } from '../../organisms/ChildNavigation'
import { WellSelection } from '../../organisms/WellSelection'

import type { SmallButton } from '../../atoms/buttons'

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
  const { onNext, onBack, state, dispatch } = props
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])

  const [selectedWells, setSelectedWells] = React.useState({})

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
        buttonIsDisabled={false}
        secondaryButtonProps={resetButtonProps}
        top={SPACING.spacing8}
      />
      <Flex
        justifyContent={JUSTIFY_CENTER}
        marginTop={SPACING.spacing120}
        padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
      >
        {state.source != null ? (
          <WellSelection
            labwareProps={{ definition: state.source }}
            selectedPrimaryWells={selectedWells}
            selectWells={wellGroup => {
              setSelectedWells(prevWells => ({ ...prevWells, ...wellGroup }))
            }}
            deselectWells={wellGroup => {
              setSelectedWells(wellGroup)
            }}
            updateHighlightedWells={wellGroup => {
              console.log(wellGroup)
            }}
            nozzleType={null}
            wellContents={{}}
          />
        ) : null}
      </Flex>
    </>
  )
}
