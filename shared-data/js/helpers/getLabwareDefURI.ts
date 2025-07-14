import type { LabwareDefinition } from '../types'

const constructLabwareDefURI = (
  namespace: string,
  loadName: string,
  version: string
): string => `${namespace}/${loadName}/${version}`

export const getLabwareDefURI = (def: LabwareDefinition): string =>
  constructLabwareDefURI(
    def.namespace,
    def.parameters.loadName,
    String(def.version)
  )
