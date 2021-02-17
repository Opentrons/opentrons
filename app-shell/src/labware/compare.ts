// @flow

import type { CheckedLabwareFile } from '@opentrons/app/src/redux/custom-labware/types'

export function sameIdentity(
  a: CheckedLabwareFile,
  b: CheckedLabwareFile
): boolean {
  return (
    a.definition != null &&
    b.definition != null &&
    a.definition.parameters.loadName === b.definition.parameters.loadName &&
    a.definition.version === b.definition.version &&
    a.definition.namespace === b.definition.namespace
  )
}
