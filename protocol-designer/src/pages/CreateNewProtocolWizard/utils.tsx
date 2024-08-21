import * as React from 'react'
import {
  MAGNETIC_BLOCK_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  getLabwareDefURI,
  getLabwareDisplayName,
  getPipetteSpecsV2,
} from '@opentrons/shared-data'
import wasteChuteImage from '../../assets/images/waste_chute.png'
import trashBinImage from '../../assets/images/flex_trash_bin.png'
import stagingAreaImage from '../../assets/images/staging_area.png'
import type {
  LabwareDefByDefURI,
  LabwareDefinition2,
  PipetteName,
} from '@opentrons/shared-data'
import type { AdditionalEquipment, WizardFormState } from './types'

const TOTAL_MODULE_SLOTS = 8
const MIDDLE_SLOT_NUM = 4

export const getNumSlotsAvailable = (
  modules: WizardFormState['modules'],
  additionalEquipment: WizardFormState['additionalEquipment'],
  //  special-casing the wasteChute available slots when there is a staging area in slot 3
  isWasteChute?: boolean
): number => {
  const additionalEquipmentLength = additionalEquipment.length
  const hasTC = Object.values(modules || {}).some(
    module => module.type === THERMOCYCLER_MODULE_TYPE
  )
  const magneticBlocks = Object.values(modules || {}).filter(
    module => module.type === MAGNETIC_BLOCK_TYPE
  )
  let filteredModuleLength = modules != null ? Object.keys(modules).length : 0
  if (hasTC) {
    filteredModuleLength = filteredModuleLength + 1
  }
  if (magneticBlocks.length > 0) {
    //  once blocks exceed 4, then we dont' want to subtract the amount available
    //  because block can go into the center slots where all other modules/trashes can not
    const numBlocks =
      magneticBlocks.length > 4 ? MIDDLE_SLOT_NUM : magneticBlocks.length
    filteredModuleLength = filteredModuleLength - numBlocks
  }

  const hasWasteChute = additionalEquipment.some(equipment =>
    equipment.includes('wasteChute')
  )
  const isStagingAreaInD3 = additionalEquipment
    .filter(equipment => equipment.includes('stagingArea'))
    .find(stagingArea => stagingArea.split('_')[1] === 'cutoutD3')
  const hasGripper = additionalEquipment.some(equipment =>
    equipment.includes('gripper')
  )

  let filteredAdditionalEquipmentLength = additionalEquipmentLength
  if (hasWasteChute && isStagingAreaInD3) {
    filteredAdditionalEquipmentLength = filteredAdditionalEquipmentLength - 1
  }
  if (isWasteChute && isStagingAreaInD3) {
    filteredAdditionalEquipmentLength = filteredAdditionalEquipmentLength - 1
  }
  if (hasGripper) {
    filteredAdditionalEquipmentLength = filteredAdditionalEquipmentLength - 1
  }
  return (
    TOTAL_MODULE_SLOTS -
    (filteredModuleLength + filteredAdditionalEquipmentLength)
  )
}

interface EquipmentProps {
  additionalEquipment: AdditionalEquipment
}

const DIMENSION = '60px'

export function AdditionalEquipmentDiagram(props: EquipmentProps): JSX.Element {
  const { additionalEquipment } = props

  switch (additionalEquipment) {
    case 'wasteChute': {
      return (
        <img
          width={DIMENSION}
          height={DIMENSION}
          src={wasteChuteImage}
          alt={additionalEquipment}
        />
      )
    }
    case 'trashBin': {
      return (
        <img
          width={DIMENSION}
          height={DIMENSION}
          src={trashBinImage}
          alt={additionalEquipment}
        />
      )
    }
    default: {
      return (
        <img
          width={DIMENSION}
          height={DIMENSION}
          src={stagingAreaImage}
          alt={additionalEquipment}
        />
      )
    }
  }
}

interface TiprackOptionsProps {
  allLabware: LabwareDefByDefURI
  allowAllTipracks: boolean
  selectedPipetteName?: string | null
}
//  returns a hashmap of LabwareDefUri : displayName
export function getTiprackOptions(
  props: TiprackOptionsProps
): Record<string, string> {
  const { allLabware, allowAllTipracks, selectedPipetteName } = props

  if (!allLabware) return {}

  const pipetteSpecs = selectedPipetteName
    ? getPipetteSpecsV2(selectedPipetteName as PipetteName)
    : null

  const defaultTipracks = pipetteSpecs?.liquids.default.defaultTipracks ?? []
  const displayCategory = pipetteSpecs?.displayCategory ?? ''
  const isFlexPipette =
    displayCategory === 'FLEX' || selectedPipetteName === 'p1000_96'

  const tiprackOptionsMap = Object.values(allLabware)
    .filter(def => def.metadata.displayCategory === 'tipRack')
    .filter(def => {
      if (allowAllTipracks) {
        return isFlexPipette
          ? def.metadata.displayName.includes('Flex') ||
              def.namespace === 'custom_beta'
          : !def.metadata.displayName.includes('Flex') ||
              def.namespace === 'custom_beta'
      }
      return (
        defaultTipracks.includes(getLabwareDefURI(def)) ||
        def.namespace === 'custom_beta'
      )
    })
    .reduce((acc: Record<string, string>, def: LabwareDefinition2) => {
      const displayName = getLabwareDisplayName(def)
      const name =
        def.parameters.loadName.includes('flex') && isFlexPipette
          ? displayName.split('Opentrons Flex')[1]
          : displayName
      acc[getLabwareDefURI(def)] = name
      return acc
    }, {})

  return tiprackOptionsMap
}
