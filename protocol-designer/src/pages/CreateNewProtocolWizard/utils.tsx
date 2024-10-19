import {
  getLabwareDefURI,
  getLabwareDisplayName,
  getPipetteSpecsV2,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_BLOCK_TYPE,
  STAGING_AREA_CUTOUTS,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import wasteChuteImage from '../../assets/images/waste_chute.png'
import trashBinImage from '../../assets/images/flex_trash_bin.png'
import stagingAreaImage from '../../assets/images/staging_area.png'
import type {
  CutoutId,
  LabwareDefByDefURI,
  LabwareDefinition2,
  PipetteName,
  ModuleType,
} from '@opentrons/shared-data'
import type { DropdownOption } from '@opentrons/components'
import type { AdditionalEquipment, WizardFormState } from './types'
import type { FormModules } from '../../step-forms'

const TOTAL_MODULE_SLOTS = 8
const MIDDLE_SLOT_NUM = 4

// export const getNumOptions = (length: number): DropdownOption[] => {
//   return Array.from({ length }, (_, i) => ({
//     name: `${i + 1}`,
//     value: `${i + 1}`,
//   }))
// }

export const getNumOptions = (
  moduleType: ModuleType,
  distribution: ModuleDistribution
): DropdownOption[] => {
  const { tc, hs, mb, tm } = distribution
  let maxCount: number

  const totalOccupiedSlots = tc * 2 + hs + tm + mb
  const maxSlots = mb === 0 ? 7 : 11
  const availableSlots = maxSlots - totalOccupiedSlots

  switch (moduleType) {
    case THERMOCYCLER_MODULE_TYPE:
      maxCount = tc === 0 ? 1 : 0
      break
    case MAGNETIC_BLOCK_TYPE:
      maxCount = Math.min(11 - (tc * 2 + hs + tm), 11)
      break
    case HEATERSHAKER_MODULE_TYPE:
    case TEMPERATURE_MODULE_TYPE:
      if (tc === 0) {
        maxCount = Math.min(
          7,
          availableSlots + (moduleType === HEATERSHAKER_MODULE_TYPE ? hs : tm)
        )
      } else {
        maxCount = Math.min(
          5,
          availableSlots + (moduleType === HEATERSHAKER_MODULE_TYPE ? hs : tm)
        )
      }
      break
    default:
      maxCount = 0
  }

  return Array.from({ length: maxCount }, (_, i) => ({
    name: `${i + 1}`,
    value: `${i + 1}`,
  }))
}

export const getNumSlotsAvailable = (
  modules: WizardFormState['modules'],
  additionalEquipment: WizardFormState['additionalEquipment']
): number => {
  const additionalEquipmentLength = additionalEquipment.length
  const hasTC = Object.values(modules || {}).some(
    module => module.type === THERMOCYCLER_MODULE_TYPE
  )
  const numStagingAreas = additionalEquipment.filter(ae => ae === 'stagingArea')
    ?.length
  const hasWasteChute = additionalEquipment.some(ae => ae === 'wasteChute')

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

  const hasGripper = additionalEquipment.some(equipment =>
    equipment.includes('gripper')
  )

  let filteredAdditionalEquipmentLength = additionalEquipmentLength
  if (hasGripper) {
    filteredAdditionalEquipmentLength = filteredAdditionalEquipmentLength - 1
  }
  if (numStagingAreas === MIDDLE_SLOT_NUM && hasWasteChute) {
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

const IMAGE_WIDTH = '60px'
const IMAGE_HEIGHT = '54px'

export function AdditionalEquipmentDiagram(props: EquipmentProps): JSX.Element {
  const { additionalEquipment } = props

  switch (additionalEquipment) {
    case 'wasteChute': {
      return (
        <img
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          src={wasteChuteImage}
          alt={additionalEquipment}
        />
      )
    }
    case 'trashBin': {
      return (
        <img
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          src={trashBinImage}
          alt={additionalEquipment}
        />
      )
    }
    default: {
      return (
        <img
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
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

export const MOVABLE_TRASH_CUTOUTS = [
  {
    value: 'cutoutA3',
    slot: 'A3',
  },
  {
    value: 'cutoutA1',
    slot: 'A1',
  },
  {
    value: 'cutoutB1',
    slot: 'B1',
  },
  {
    value: 'cutoutB3',
    slot: 'B3',
  },
  {
    value: 'cutoutC1',
    slot: 'C1',
  },
  {
    value: 'cutoutC3',
    slot: 'C3',
  },
  {
    value: 'cutoutD1',
    slot: 'D1',
  },
  {
    value: 'cutoutD3',
    slot: 'D3',
  },
]

export const getTrashSlot = (values: WizardFormState): string => {
  const { additionalEquipment, modules } = values
  const moduleSlots =
    modules != null
      ? Object.values(modules).flatMap(module =>
          module.type === THERMOCYCLER_MODULE_TYPE
            ? [module.slot, 'A1']
            : module.slot
        )
      : []
  const stagingAreas = additionalEquipment.filter(equipment =>
    equipment.includes('stagingArea')
  )

  const cutouts = stagingAreas.map((_, index) => STAGING_AREA_CUTOUTS[index])
  const hasWasteChute = additionalEquipment.find(equipment =>
    equipment.includes('wasteChute')
  )
  const wasteChuteSlot = Boolean(hasWasteChute)
    ? [WASTE_CHUTE_CUTOUT as string]
    : []
  const unoccupiedSlot = MOVABLE_TRASH_CUTOUTS.find(
    cutout =>
      !cutouts.includes(cutout.value as CutoutId) &&
      !moduleSlots.includes(cutout.slot) &&
      !wasteChuteSlot.includes(cutout.value)
  )
  if (unoccupiedSlot == null) {
    console.error(
      'Expected to find an unoccupied slot for the trash bin but could not'
    )
    return ''
  }
  return unoccupiedSlot?.value
}

interface ModuleDistribution {
  tc: number
  hs: number
  mb: number
  tm: number
}

const TOTAL_SLOTS_WITHOUT_TWO_COL = 7
const TWO_COL_SLOTS = 4

export const getModuleDistribution = (
  modules: FormModules | null
): ModuleDistribution => {
  let tc = 0
  let hs = 0
  let mb = 0
  let tm = 0

  if (modules === null) return { tc, hs, mb, tm }

  Object.values(modules).forEach(module => {
    switch (module.type) {
      case THERMOCYCLER_MODULE_TYPE:
        // TC occupies A1+B1
        tc++
        break
      case HEATERSHAKER_MODULE_TYPE:
        hs++
        break
      case MAGNETIC_BLOCK_TYPE:
        mb++
        break
      case TEMPERATURE_MODULE_TYPE:
        tm++
        break
    }
  })

  return { tc, hs, mb, tm }
}

export const getAvailableSlots = (
  distribution: ModuleDistribution
): {
  regular: number
  magnetic: number
} => {
  if (distribution === null)
    return { regular: TOTAL_SLOTS_WITHOUT_TWO_COL, magnetic: TWO_COL_SLOTS }
  const { tc, hs, mb, tm } = distribution

  // マグネティックブロック用のスロット
  const availableMagneticSlots = 11 - (tc * 2 + hs + tm + mb)

  // 通常のモジュール用のスロット
  const availableRegularSlots = 7 - (hs + tm + (tc > 0 ? 2 : 0))

  return {
    regular: Math.max(0, availableRegularSlots),
    magnetic: Math.max(0, availableMagneticSlots),
  }
}

export const getCanAddModule = (
  moduleType: ModuleType,
  distribution: ModuleDistribution
): boolean => {
  const availableSlots = getAvailableSlots(distribution)
  const { tc, hs, mb, tm } = distribution

  switch (moduleType) {
    case THERMOCYCLER_MODULE_TYPE:
      return tc === 0 && availableSlots.regular >= 2
    case MAGNETIC_BLOCK_TYPE:
      return availableSlots.magnetic > 0
    case HEATERSHAKER_MODULE_TYPE:
    case TEMPERATURE_MODULE_TYPE:
      return availableSlots.regular > 0 || (hs + tm < 5 && tc === 0)
    default:
      return false
  }
}
