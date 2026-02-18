import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { ListButton, StyledText } from '@opentrons/components'
import { ALL, COLUMN, ROW } from '@opentrons/shared-data'
import { getDefaultPrimaryNozzle } from '@opentrons/step-generation'

import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'

import { NozzleAndWellSelectionModal } from './NozzleAndWellSelectionModal'
import styles from './nozzleandwellwizard.module.css'
import { getNozzleText, getWellGroupLength, partialNozzleMap } from './utils'

import type {
  LabwareDefinition,
  NozzleConfigurationStyle,
  PartialPrimaryNozzles,
  PipetteV2Specs,
  PrimaryNozzleConfigurationStyle,
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
  const { pipetteSpecs, propsForFields, stepType } = props
  const { t } = useTranslation('protocol_steps')
  const deckSetup = useSelector(getInitialDeckSetup)
  const { channels } = pipetteSpecs
  const [isNozzleAndWellModalOpen, setIsNozzleAndWellModalOpen] =
    useState<boolean>(false)
  const handleOpen = (): void => {
    setIsNozzleAndWellModalOpen(true)
  }
  const primaryNozzle =
    (propsForFields.primaryNozzle.value as PrimaryNozzleConfigurationStyle) ??
    getDefaultPrimaryNozzle({ nozzles: ALL, channels: channels })
  const nozzleConfiguration =
    (propsForFields.nozzles.value as NozzleConfigurationStyle) ?? ALL
  const partialNozzleCount =
    partialNozzleMap[primaryNozzle as PartialPrimaryNozzles]

  let aspWells: string[] = []
  let aspLabwareDef: LabwareDefinition | null = null
  switch (stepType) {
    case 'mix':
      aspWells = propsForFields.wells
        ? (propsForFields.wells.value as [])
        : aspWells
      aspLabwareDef = deckSetup.labware[propsForFields.labware.value as string]
        .def as LabwareDefinition
      break
    case 'transfer':
      aspWells = propsForFields.aspirate_wells.value as []
      aspLabwareDef = deckSetup.labware[
        propsForFields.aspirate_labware.value as string
      ].def as LabwareDefinition

      break
  }
  const dspWells = propsForFields.dispense_wells
    ? (propsForFields.dispense_wells.value as [])
    : []
  const dspLabwareDef = propsForFields.dispense_wells
    ? (deckSetup.labware[propsForFields.dispense_labware.value as string]
        .def as LabwareDefinition)
    : null

  const aspWellsLength = aspLabwareDef
    ? getWellGroupLength(
        aspWells.length,
        aspLabwareDef.ordering,
        nozzleConfiguration
      )
    : 0

  const dspWellsLength = dspLabwareDef
    ? getWellGroupLength(
        dspWells.length,
        dspLabwareDef.ordering,
        nozzleConfiguration
      )
    : 0

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
    const isTransfer = stepType === 'transfer'
    const isRowOrColumn =
      nozzleConfiguration === ROW || nozzleConfiguration === COLUMN
    const hasRequiredWells =
      aspWells.length > 0 && (!isTransfer || dspWells.length > 0)
    if (!nozzleText || !hasRequiredWells) {
      return t('no_nozzles_and_wells_selected')
    }
    const positionType = isRowOrColumn
      ? `${nozzleConfiguration.toLowerCase()}s`
      : 'wells'

    let nozzleSelection = `${nozzleText} nozzles`
    if (isRowOrColumn) {
      nozzleSelection = `${nozzleText}${positionType} nozzles`
    } else if (isTransfer) {
      nozzleSelection = nozzleText
    }

    if (isTransfer) {
      return t('transfer_nozzles_selected', {
        nozzleSelection,
        aspWells: aspWellsLength,
        dispWells: dspWellsLength,
        positionType,
      })
    }

    return t('mix_nozzles_selected', {
      nozzleSelection,
      aspWells: aspWellsLength,
    })
  }

  return (
    <>
      <div className={styles.nozzle_selection_text}>
        <ListButton type="noActive" onClick={handleOpen}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {getNozzleWellText(primaryNozzle, nozzleConfiguration, stepType)}
          </StyledText>
        </ListButton>
      </div>
      {isNozzleAndWellModalOpen ? (
        <NozzleAndWellSelectionModal
          showModal={setIsNozzleAndWellModalOpen}
          totalSteps={3}
          pipetteSpecs={pipetteSpecs}
          deckSetup={deckSetup}
          propsForFields={propsForFields}
          stepType={stepType}
        />
      ) : null}
    </>
  )
}
