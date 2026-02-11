import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { ListButton, StyledText } from '@opentrons/components'
import { ALL, COLUMN, PARTIAL, ROW, SINGLE } from '@opentrons/shared-data'

import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'

import { NozzleAndWellSelectionModal } from './NozzleAndWellSelectionModal'
import styles from './nozzleandwellwizard.module.css'

import type { DropdownOption } from '@opentrons/components'
import type {
  NozzleConfigurationStyle,
  PipetteV2Specs,
} from '@opentrons/shared-data'
import type { FieldProps, FieldPropsByName } from '../../types'

interface ExtendedPartialTipFieldProps extends FieldProps {
  pipetteSpecs: PipetteV2Specs
  propsForFields: FieldPropsByName
  stepType: string
}
export function ExtendedPartialTipField(
  props: ExtendedPartialTipFieldProps
): JSX.Element {
  const { updateValue, pipetteSpecs, propsForFields, stepType } = props
  const { t } = useTranslation('protocol_steps')
  const deckSetup = useSelector(getInitialDeckSetup)

  const [isNozzleAndWellModalOpen, setIsNozzleAndWellModalOpen] =
    useState<boolean>(false)
  const handleOpen = (): void => {
    setIsNozzleAndWellModalOpen(true)
  }

  const { channels } = pipetteSpecs
  const tipracks = Object.values(deckSetup.labware).filter(
    labware => labware.def.parameters.isTiprack
  )
  const tipracksNotOnAdapter = tipracks.filter(
    tiprack => tiprack.stack.length === 2
  )
  const areAllTipracksOnAdapter = tipracksNotOnAdapter.length === 0

  let aspWells: string[] = []
  switch (stepType) {
    case 'mix':
      aspWells = propsForFields.wells
        ? (propsForFields.wells.value as [])
        : aspWells
      break
    case 'transfer':
      aspWells = propsForFields.aspirate_wells.value as []
      break
  }
  const aspWellsLength = aspWells.length
  const dspWells = propsForFields.dispense_wells
    ? (propsForFields.dispense_wells.value as [])
    : []
  const dspWellsLength = dspWells.length

  function getNozzleWellText(
    primaryNozzle: PrimaryNozzleConfigurationStyle,
    nozzleConfiguration: NozzleConfigurationStyle,
    stepType: string
  ): string {
    const nozzleText = getNozzleText(
      primaryNozzle,
      nozzleConfiguration,
      partialNozzleCount
    )
    if (
      nozzleText === null ||
      aspWells.length === 0 ||
      (stepType !== 'Mix' && dspWells.length === 0)
    ) {
      return t('no_nozzles_and_wells_selected')
    }

    switch (nozzleConfiguration) {
      case ROW:
      case COLUMN:
        const selectedValueText = selectedValue.toLowerCase() + 's'
        return t('nozzles_selected', {
          nozzleSelection: 'Left' + selectedValueText + ' nozzles',
          aspWells: aspWellsLength,
          dispWells: dspWellsLength,
          positionType: selectedValueText,
        })
      case ALL:
        return t('nozzles_selected', {
          nozzleSelection: 'All nozzles',
          aspWells: aspWellsLength,
          dispWells: dspWellsLength,
          positionType: 'wells',
        })
      case SINGLE:
        return t('nozzles_selected', {
          nozzleSelection: nozzle + ' nozzle',
          aspWells: aspWellsLength,
          dispWells: dspWellsLength,
          positionType: 'wells',
        })
      case PARTIAL:
        return t('nozzles_selected', {
          nozzleSelection: nozzle.length + ' nozzles',
          aspWells: aspWellsLength,
          dispWells: dspWellsLength,
          positionType: 'wells',
        })
      default:
        return t('no_nozzles_and_wells_selected')
    }
  }
  return (
    <>
      <div className={styles.nozzle_selection_text}>
        <ListButton type="noActive" onClick={handleOpen}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {getNozzleWellText()}
          </StyledText>
        </ListButton>
      </div>
      {isNozzleAndWellModalOpen ? (
        <NozzleAndWellSelectionModal
          showModal={setIsNozzleAndWellModalOpen}
          totalSteps={3}
          pipetteSpecs={pipetteSpecs}
          updateValue={updateValue}
          setSelectedValue={setSelectedValue}
          options={options}
          deckSetup={deckSetup}
          propsForFields={propsForFields}
          stepType={stepType}
          value={selectedValue as NozzleConfigurationStyle}
        />
      ) : null}
    </>
  )
}
