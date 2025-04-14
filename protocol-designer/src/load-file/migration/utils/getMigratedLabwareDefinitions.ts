import { getOnlyLatestDefs } from '../../../labware-defs'
import type {
  LabwareDefinition2,
  LoadLabwareCreateCommand,
} from '@opentrons/shared-data'

interface MigratedLabwareInfo {
  [definitionId: string]: { labwareDef: LabwareDefinition2; id: string }
}

interface MigratedLabwareDefinitionsProps {
  labwareDefsByUri: MigratedLabwareInfo
  loadLabwareCommands: LoadLabwareCreateCommand[]
}
export const getMigratedLabwareDefinitions = (
  props: MigratedLabwareDefinitionsProps
): MigratedLabwareInfo => {
  const { labwareDefsByUri, loadLabwareCommands } = props

  const latestDefinitions = getOnlyLatestDefs()

  const migratedLabwareDefinitions: LabwareDefsByURI = Object.entries(
    labwareDefsByUri
  ).reduce((acc: LabwareDefsByURI, [uri, def]) => {
    if (latestDefinitions[uri] != null) {
      return {
        ...acc,
        [uri]: latestDefinitions[uri],
      }
    }

    const matchingLabwareFromLatest = Object.values(latestDefinitions).find(
      latestDef =>
        latestDef.parameters.loadName === def.parameters.loadName &&
        latestDef.namespace === def.namespace
    )

    if (matchingLabwareFromLatest == null) {
      console.error(
        `expected to find a matching labware def to migrate to with uri ${uri} but could not`
      )
      return acc
    }

    const { namespace, parameters, version } = matchingLabwareFromLatest
    const newDefUri = `${namespace}/${parameters.loadName}/${version}`

    return {
      ...acc,
      [newDefUri]: matchingLabwareFromLatest,
    }
  }, {})

  return migratedLabwareDefinitions
}
