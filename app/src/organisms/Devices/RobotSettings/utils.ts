import { getLabwareDisplayName } from '@opentrons/shared-data'
import { findLabwareDefWithCustom } from '../../../assets/labware/findLabware'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

const UNKNOWN_CUSTOM_LABWARE = 'unknown custom tiprack'

export function getDisplayNameForTipRack(
  tiprackUri: string,
  customLabware: LabwareDefinition2[]
): string {
  const [namespace, loadName] = tiprackUri ? tiprackUri.split('/') : ['', '']
  const definition = findLabwareDefWithCustom(
    namespace,
    loadName,
    null,
    customLabware
  )
  return definition
    ? getLabwareDisplayName(definition)
    : `${UNKNOWN_CUSTOM_LABWARE}`
}
