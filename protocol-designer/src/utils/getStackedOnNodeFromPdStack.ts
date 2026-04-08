import { HOPPER_STACKER_LOCATION } from '@opentrons/step-generation'

import type {
  AddressableAreaName,
  LoadedLabwareLocation,
} from '@opentrons/shared-data'
import type { ModuleEntities } from '../step-forms'

/**
 * Immediate PE `LoadedLabware.location` for this labware from a PD-style `stack` (top → bottom).
 */
export function getStackedOnNodeFromPdStack(args: {
  stack: string[]
  subjectLabwareId: string
  moduleEntities: ModuleEntities
  labwareEntityIds: ReadonlySet<string>
}): LoadedLabwareLocation | undefined {
  const { stack, subjectLabwareId, moduleEntities, labwareEntityIds } = args

  if (stack.length === 0 || stack[0] !== subjectLabwareId || stack.length < 2) {
    return undefined
  }

  const parent = stack[1]

  if (parent === HOPPER_STACKER_LOCATION) {
    const moduleId = stack[2]
    if (moduleId == null) {
      return undefined
    }
    return { kind: 'inStackerHopper', moduleId }
  }

  if (moduleEntities[parent] != null) {
    return { moduleId: parent }
  }

  if (labwareEntityIds.has(parent)) {
    return { labwareId: parent }
  }

  if (parent === 'offDeck') {
    return 'offDeck'
  }

  if (parent === 'systemLocation') {
    return 'systemLocation'
  }

  if (parent === 'wasteChuteLocation') {
    return 'wasteChuteLocation'
  }

  if (shouldUseAddressableAreaNameForStackParent(parent)) {
    return { addressableAreaName: parent as AddressableAreaName }
  }

  return { slotName: parent }
}

function shouldUseAddressableAreaNameForStackParent(s: string): boolean {
  return (
    s.includes('Chute') ||
    s.includes('Waste') ||
    s.startsWith('gripper') ||
    s === '96ChannelWasteChute'
  )
}
