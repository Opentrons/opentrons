import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { ListButton, StyledText } from '@opentrons/components'
import { ALL, COLUMN, PARTIAL, ROW, SINGLE } from '@opentrons/shared-data'
import { getDefaultPrimaryNozzle } from '@opentrons/step-generation'

import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'

import { NozzleAndWellSelectionModal } from './NozzleAndWellSelectionModal'
import styles from './nozzleandwellwizard.module.css'
import { getNozzleText, partialNozzleMap } from './utils'

import type {
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
        const selectedValueText = nozzleConfiguration.toLowerCase()
        if (stepType === 'transfer') {
          return t('transfer_nozzles_selected', {
            nozzleSelection: nozzleText + selectedValueText + ' nozzles',
            aspWells: aspWellsLength,
            dispWells: dspWellsLength,
            positionType: selectedValueText,
          })
        } else {
          return t('mix_nozzles_selected', {
            nozzleSelection: nozzleText + selectedValueText + ' nozzles',
            aspWells: aspWellsLength,
          })
        }

      case ALL:
      case SINGLE:
      case PARTIAL:
        if (stepType === 'transfer') {
          return t('transfer_nozzles_selected', {
            nozzleSelection: nozzleText,
            aspWells: aspWellsLength,
            dispWells: dspWellsLength,
            positionType: 'wells',
          })
        } else {
          return t('mix_nozzles_selected', {
            nozzleSelection: nozzleText + ' nozzles',
            aspWells: aspWellsLength,
          })
        }
      default:
        return t('no_nozzles_and_wells_selected')
    }
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
