import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import without from 'lodash/without'
import {
  COLORS,
  Flex,
  POSITION_FIXED,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { getTopPortalEl } from '../../App/portal'
import { Modal } from '../../molecules/Modal'
import { ChildNavigation } from '../../organisms/ChildNavigation'
import { useToaster } from '../../organisms/ToasterOven'
import { WellSelection } from '../../organisms/WellSelection'

import type { SmallButton } from '../../atoms/buttons'
import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'
import type {
  QuickTransferWizardState,
  QuickTransferWizardAction,
} from './types'

interface SelectDestWellsProps {
  onNext: () => void
  onBack: () => void
  state: QuickTransferWizardState
  dispatch: React.Dispatch<QuickTransferWizardAction>
}

export function SelectDestWells(props: SelectDestWellsProps): JSX.Element {
  const { onNext, onBack, state, dispatch } = props
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])

  const { makeToast } = useToaster()

  const destinationWells = state.destinationWells ?? []
  const destinationWellGroup = destinationWells.reduce((acc, well) => {
    return { ...acc, [well]: null }
  }, {})

  const [
    showNumberWellsSelectedErrorModal,
    setShowNumberWellsSelectedErrorModal,
  ] = React.useState(false)
  const [selectedWells, setSelectedWells] = React.useState(destinationWellGroup)
  const [
    isNumberWellsSelectedError,
    setIsNumberWellsSelectedError,
  ] = React.useState(false)

  const selectedWellCount = Object.keys(selectedWells).length
  const sourceWellCount = state.sourceWells?.length ?? 0
  const channels = state.pipette?.channels ?? 1

  let selectionUnit = t('well')
  let selectionUnits = t('wells')

  if (channels === 8) {
    selectionUnit = t('column')
    selectionUnits = t('columns')
  } else if (channels === 96) {
    selectionUnit = t('grid')
    selectionUnits = t('grids')
  }

  const handleClickNext = (): void => {
    if (
      selectedWellCount === 1 ||
      selectedWellCount === sourceWellCount ||
      sourceWellCount === 1
    ) {
      dispatch({
        type: 'SET_DEST_WELLS',
        wells: Object.keys(selectedWells),
      })
      onNext()
    } else {
      setIsNumberWellsSelectedError(true)
      makeToast(
        t('number_wells_selected_error_message', {
          wellCount: sourceWellCount,
          selectionUnits,
        }),
        'error',
        {
          closeButton: true,
          disableTimeout: true,
          displayType: 'odd',
          linkText: t('learn_more'),
          onLinkClick: () => {
            setShowNumberWellsSelectedErrorModal(true)
          },
        }
      )
    }
  }

  const resetButtonProps: React.ComponentProps<typeof SmallButton> = {
    buttonType: 'tertiaryLowLight',
    buttonText: t('shared:reset'),
    onClick: () => {
      setIsNumberWellsSelectedError(false)
      setSelectedWells({})
    },
  }

  return (
    <>
      {createPortal(
        showNumberWellsSelectedErrorModal ? (
          <NumberWellsSelectedErrorModal
            setShowNumberWellsSelectedErrorModal={
              setShowNumberWellsSelectedErrorModal
            }
            wellCount={sourceWellCount}
            selectionUnit={selectionUnit}
            selectionUnits={selectionUnits}
          />
        ) : null,
        getTopPortalEl()
      )}
      <ChildNavigation
        header={t('select_dest_wells')}
        onClickBack={onBack}
        buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        onClickButton={handleClickNext}
        buttonIsDisabled={selectedWellCount === 0 || isNumberWellsSelectedError}
        secondaryButtonProps={resetButtonProps}
        top={SPACING.spacing8}
      />
      <Flex
        marginTop={SPACING.spacing120}
        padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
        position={POSITION_FIXED}
        top="0"
        left="0"
        width="100%"
      >
        {state.destination != null && state.source != null ? (
          <WellSelection
            definition={
              state.destination === 'source' ? state.source : state.destination
            }
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
              if (Object.keys(wellGroup).length > 0) {
                setIsNumberWellsSelectedError(false)
                setSelectedWells(prevWells => ({ ...prevWells, ...wellGroup }))
              }
            }}
            channels={channels}
          />
        ) : null}
      </Flex>
    </>
  )
}

function NumberWellsSelectedErrorModal({
  setShowNumberWellsSelectedErrorModal,
  wellCount,
  selectionUnit,
  selectionUnits,
}: {
  setShowNumberWellsSelectedErrorModal: React.Dispatch<
    React.SetStateAction<boolean>
  >
  wellCount: number
  selectionUnit: string
  selectionUnits: string
}): JSX.Element {
  const { t } = useTranslation('quick_transfer')
  const modalHeader: ModalHeaderBaseProps = {
    title: t('well_selection'),
    iconName: 'information',
    iconColor: COLORS.black90,
    hasExitIcon: true,
    onClick: () => {
      setShowNumberWellsSelectedErrorModal(false)
    },
  }

  return (
    <Modal
      header={modalHeader}
      onOutsideClick={() => {
        setShowNumberWellsSelectedErrorModal(false)
      }}
    >
      <StyledText as="p">
        {t('number_wells_selected_error_learn_more', {
          wellCount,
          selectionUnit,
          selectionUnits,
        })}
      </StyledText>
    </Modal>
  )
}
