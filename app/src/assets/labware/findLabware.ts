import head from 'lodash/head'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

import { getLatestLabwareDef } from './getLabware'

// TODO(mc, 2021-05-19): this function does not filter by namespace
// nor version. Instead, it short-circuits as soon as it finds a loadName match
// bugfix ticket: https://github.com/Opentrons/opentrons/issues/7823
function filterLabwareDefinitions(
  namespace: string | null,
  loadName: string | null,
  version: string | null,
  customLabware: LabwareDefinition2[]
): LabwareDefinition2 | null {
  return (
    head(
      customLabware.filter(
        def =>
          (loadName && def.parameters.loadName === loadName) ||
          (namespace && def.namespace === namespace) ||
          (version && String(def.version) === version)
      )
    ) || null
  )
}

export function findLabwareDefWithCustom(
  namespace: string | null,
  loadName: string | null,
  version: string | null,
  customLabware: LabwareDefinition2[]
): LabwareDefinition2 | null {
  return namespace === 'opentrons'
    ? getLatestLabwareDef(loadName)
    : filterLabwareDefinitions(namespace, loadName, version, customLabware)
}
