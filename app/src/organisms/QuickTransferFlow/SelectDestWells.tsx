import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import without from 'lodash/without'
import {
  COLORS,
  Flex,
  POSITION_FIXED,
  SPACING,
  LegacyStyledText,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { getAllDefinitions } from '@opentrons/shared-data'

import { getTopPortalEl } from '../../App/portal'
import { OddModal } from '/app/molecules/OddModal'
import { ChildNavigation } from '/app/organisms/ChildNavigation'
import { useToaster } from '/app/organisms/ToasterOven'
import { WellSelection } from '/app/organisms/WellSelection'
import {
  CIRCULAR_WELL_96_PLATE_DEFINITION_URI,
  RECTANGULAR_WELL_96_PLATE_DEFINITION_URI,
} from './SelectSourceWells'

import type { SmallButton } from '../../atoms/buttons'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'
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
        }) as string,
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
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsNumberWellsSelectedError(false)
      setSelectedWells({})
      e.currentTarget.blur?.()
    },
  }
  let labwareDefinition =
    state.destination === 'source' ? state.source : state.destination
  if (labwareDefinition?.parameters.format === '96Standard') {
    const allDefinitions = getAllDefinitions()
    if (Object.values(labwareDefinition.wells)[0].shape === 'circular') {
      labwareDefinition = allDefinitions[CIRCULAR_WELL_96_PLATE_DEFINITION_URI]
    } else {
      labwareDefinition =
        allDefinitions[RECTANGULAR_WELL_96_PLATE_DEFINITION_URI]
    }
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
        justifyContent={JUSTIFY_CENTER}
        marginTop={SPACING.spacing120}
        padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing8} ${SPACING.spacing32}`}
        position={POSITION_FIXED}
        top="0"
        left="0"
        height="80%"
        width="100%"
      >
        {labwareDefinition != null ? (
          <Flex
            width={
              labwareDefinition?.parameters.format === '384Standard'
                ? '100%'
                : '75%'
            }
          >
            <WellSelection
              definition={labwareDefinition}
              deselectWells={(wells: string[]) => {
                setIsNumberWellsSelectedError(false)
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
                  setSelectedWells(prevWells => ({
                    ...prevWells,
                    ...wellGroup,
                  }))
                }
              }}
              channels={channels}
            />
          </Flex>
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
  const modalHeader: OddModalHeaderBaseProps = {
    title: t('well_selection'),
    iconName: 'information',
    iconColor: COLORS.black90,
    hasExitIcon: true,
    onClick: () => {
      setShowNumberWellsSelectedErrorModal(false)
    },
  }

  return (
    <OddModal
      header={modalHeader}
      onOutsideClick={() => {
        setShowNumberWellsSelectedErrorModal(false)
      }}
    >
      <LegacyStyledText as="p">
        {t('number_wells_selected_error_learn_more', {
          wellCount,
          selectionUnit,
          selectionUnits,
        })}
      </LegacyStyledText>
    </OddModal>
  )
}
