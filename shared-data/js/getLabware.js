// @flow
import type {LabwareDefinition} from './types'
import definitions from '../build/labware.json'

export default function getLabware (labwareName: string): ?LabwareDefinition {
  const labware: ?LabwareDefinition = definitions[labwareName]
  return labware
}
