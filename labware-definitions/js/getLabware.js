// @flow
import type {LabwareDefinition} from './types'
import definitions from '../build/labware.json'

export default function getLabware (labwareName: string): LabwareDefinition {
  const labware: ?LabwareDefinition = definitions[labwareName]
  if (!labware) {
    throw new Error(`No definition found for labware: "${labwareName}"`)
  }
  return labware
}
