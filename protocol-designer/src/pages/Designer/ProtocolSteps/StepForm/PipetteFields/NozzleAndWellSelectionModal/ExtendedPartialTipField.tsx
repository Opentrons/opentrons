import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { COLORS, ListButton, StyledText } from '@opentrons/components'
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
  const partialChannels =
    primaryNozzle in partialNozzleMap
      ? partialNozzleMap[primaryNozzle as PartialPrimaryNozzles]
      : 0
  const aspWellsLength = aspLabwareDef
    ? getWellGroupLength(
        aspWells.length,
        aspLabwareDef.ordering,
        nozzleConfiguration,
        partialChannels
      )
    : 0

  const dspWellsLength = dspLabwareDef
    ? getWellGroupLength(
        dspWells.length,
        dspLabwareDef.ordering,
        nozzleConfiguration,
        partialChannels
      )
    : 0

  function getNozzleWellText(
    primaryNozzle: PrimaryNozzleConfigurationStyle,
    nozzleConfiguration: NozzleConfigurationStyle,
    stepType: string,
    channels: number
  ): string {
    const nozzleText = getNozzleText(
      primaryNozzle,
      nozzleConfiguration,
      partialNozzleCount
    )
    const isTransfer = stepType === 'transfer'
    const isColumn =
      (channels === 8 && nozzleConfiguration === ALL) ||
      nozzleConfiguration === COLUMN
    const isRow = nozzleConfiguration === ROW
    const hasRequiredWells =
      aspWells.length > 0 && (!isTransfer || dspWells.length > 0)
    if (!nozzleText || !hasRequiredWells) {
      return t('no_nozzles_and_wells_selected')
    }
    let positionType: string = 'wells'
    if (isColumn) {
      positionType = 'columns'
    }
    if (isRow) {
      positionType = 'rows'
    }

    let nozzleSelection = `${nozzleText} nozzles`
    if ((isRow || isColumn) && channels === 96) {
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
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('pipette_nozzles_and_wells')}
        </StyledText>
        <ListButton type="noActive" onClick={handleOpen}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {getNozzleWellText(
              primaryNozzle,
              nozzleConfiguration,
              stepType,
              channels
            )}
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
