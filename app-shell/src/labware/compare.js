// @flow

import type { CheckedLabwareFile } from '@opentrons/app/src/custom-labware/types'

export function sameIdentity(
  a: CheckedLabwareFile,
  b: CheckedLabwareFile
): boolean {
  return (
    a.identity != null &&
    b.identity != null &&
    a.identity.name === b.identity.name &&
    a.identity.version === b.identity.version &&
    a.identity.namespace === b.identity.namespace
  )
}
