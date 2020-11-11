// @flow
import { format } from 'date-fns'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { findLabwareDefWithCustom } from '../../findLabware'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

const UNKNOWN_CUSTOM_LABWARE = 'unknown custom tiprack'

export function getDisplayNameForTipRack(
  tiprackUri: string,
  customLabware: Array<LabwareDefinition2>
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

export function formatLastModified(lastModified: string | null): string {
  return typeof lastModified === 'string'
    ? format(new Date(lastModified), 'MMMM dd, yyyy HH:mm')
    : 'unknown'
}
