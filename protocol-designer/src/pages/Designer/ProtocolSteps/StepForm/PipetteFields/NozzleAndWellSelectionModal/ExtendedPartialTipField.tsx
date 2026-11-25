import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { COLORS, ListButton, StyledText } from '@opentrons/components'
import { ALL, COLUMN, PARTIAL_NOZZLE_MAP, ROW } from '@opentrons/shared-data'
import { getDefaultPrimaryNozzle } from '@opentrons/step-generation'

import {
  getInitialDeckSetup,
  getInvariantContext,
} from '/protocol-designer/step-forms/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import { PLURAL_COLUMNS, PLURAL_ROWS } from './constants'
import { getAllWellsSafetyStatus } from './getAllWellsSafetyStatus'
import { NozzleAndWellSelectionModal } from './NozzleAndWellSelectionModal'
import styles from './nozzleandwellwizard.module.css'
import { getNozzleText, getWellGroupLength } from './utils'

import type { ReactNode } from 'react'
import type {
  ActiveNozzleNumber,
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
  stepType: 'mix' | 'transfer'
}
export function ExtendedPartialTipField(
  props: ExtendedPartialTipFieldProps
): ReactNode {
  const { pipetteSpecs, propsForFields, stepType } = props
  const { t } = useTranslation('protocol_steps')
  const deckSetup = useSelector(getInitialDeckSetup)
  const invariantContext = useSelector(getInvariantContext)
  const robotState = useSelector(getRobotStateAtActiveItem)
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
  // if deck setup changes and selected wells are now inaccessible - unselect them so that an error is raised
  interface WellCheckConfig {
    wells: string[][]
    selectedWells: string[]
    labwareId: string | null
    fieldKey: keyof FieldPropsByName
  }
  const wellConfigs: WellCheckConfig[] = []
  const addWellConfig = (
    labwareId: string,
    selectedWells: string[] | undefined,
    fieldKey: keyof FieldPropsByName
  ): void => {
    const wells =
      invariantContext.labwareEntities[labwareId]?.def.ordering ?? []

    wellConfigs.push({
      wells,
      selectedWells: selectedWells ?? [],
      labwareId,
      fieldKey,
    })
  }
  if (stepType === 'mix') {
    addWellConfig(
      propsForFields.labware.value as string,
      propsForFields.wells?.value as string[],
      'wells'
    )
  }
  if (stepType === 'transfer') {
    addWellConfig(
      propsForFields.aspirate_labware.value as string,
      propsForFields.aspirate_wells?.value as string[],
      'aspirate_wells'
    )
    addWellConfig(
      propsForFields.dispense_labware.value as string,
      propsForFields.dispense_wells?.value as string[],
      'dispense_wells'
    )
  }
  const tiprackLabwareDefURI = propsForFields.tipRack.value as string
  const tiprackId = Object.values(deckSetup.labware).find(
    labware => labware.labwareDefURI === tiprackLabwareDefURI
  )?.id
  const inaccessibleFields = wellConfigs
    .map(config => {
      if (!config.labwareId || config.wells.length === 0) {
        return null
      }

      const status = getAllWellsSafetyStatus({
        allWells: config.wells,
        robotState,
        invariantContext,
        pipetteId: propsForFields.pipette.value as string,
        labwareId: config.labwareId,
        primaryNozzle: primaryNozzle,
        nozzleConfiguration: nozzleConfiguration,
        tiprackId,
      })

      const hasInaccessibleWell = config.selectedWells.some(
        well => status[well] !== 0
      )

      return hasInaccessibleWell ? config.fieldKey : null
    })
    .filter(Boolean) as Array<keyof FieldPropsByName>
  useEffect(() => {
    inaccessibleFields.forEach(fieldKey => {
      propsForFields[fieldKey]?.updateValue([])
    })
  }, [inaccessibleFields, propsForFields])

  const dspWells = propsForFields.dispense_wells
    ? (propsForFields.dispense_wells.value as [])
    : []
  const dispenseLocation = propsForFields.dispense_labware?.value as string
  const isDispenseInLabware = deckSetup.labware[dispenseLocation] !== undefined
  const dspLabwareDef = isDispenseInLabware
    ? (deckSetup.labware[dispenseLocation].def as LabwareDefinition)
    : null
  const totalSteps = isDispenseInLabware ? 3 : 2
  const partialChannels =
    primaryNozzle in PARTIAL_NOZZLE_MAP
      ? PARTIAL_NOZZLE_MAP[primaryNozzle as PartialPrimaryNozzles]
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
    channels: ActiveNozzleNumber
  ): string {
    const nozzleText = getNozzleText(primaryNozzle, nozzleConfiguration)
    const isTransfer = stepType === 'transfer'
    const isColumn =
      (channels === 8 && nozzleConfiguration === ALL) ||
      nozzleConfiguration === COLUMN
    const isRow = nozzleConfiguration === ROW
    if (
      !nozzleText ||
      aspWellsLength === 0 ||
      (isTransfer && isDispenseInLabware && dspWellsLength === 0)
    ) {
      return t('no_nozzles_and_wells_selected')
    }
    let positionType: string = 'wells'
    if (isColumn) {
      positionType = PLURAL_COLUMNS
    }
    if (isRow) {
      positionType = PLURAL_ROWS
    }

    let nozzleSelection = `${nozzleText} nozzles`
    if ((isRow || isColumn) && channels === 96) {
      nozzleSelection = `${nozzleText}${positionType} nozzles`
    } else if (isTransfer) {
      nozzleSelection = nozzleText
    }

    if (isTransfer) {
      if (dspWellsLength > 0) {
        return t('transfer_nozzles_selected', {
          nozzleSelection,
          aspWells: aspWellsLength,
          dispWells: dspWellsLength,
          positionType,
        })
      } else {
        return t('transfer_nozzles_selected_no_dispense', {
          nozzleSelection,
          aspWells: aspWellsLength,
          positionType,
        })
      }
    }

    return t('mix_nozzles_selected', {
      nozzleSelection,
      aspWells: aspWellsLength,
    })
  }

  const fieldsForWellSelection = [
    'primaryNozzle',
    'nozzles',
    ...(stepType === 'transfer'
      ? ['aspirate_wells', 'dispense_wells']
      : ['wells']),
  ]
  const shouldShowErrorForNozzleAndWellModalButton =
    fieldsForWellSelection.some(
      field => propsForFields[field].errorToShow != null
    )

  return (
    <>
      <div className={styles.nozzle_selection_text}>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('pipette_nozzles_and_wells')}
        </StyledText>
        <ListButton
          type={
            shouldShowErrorForNozzleAndWellModalButton ? 'error' : 'noActive'
          }
          onClick={handleOpen}
          testId="nozzle_and_well_modal"
        >
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
          totalSteps={totalSteps}
          pipetteSpecs={pipetteSpecs}
          deckSetup={deckSetup}
          propsForFields={propsForFields}
          stepType={stepType}
        />
      ) : null}
    </>
  )
}
