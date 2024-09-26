import type { RunTimeParameter } from '@opentrons/shared-data'
import type { RunTimeParameterFilesCreateData } from '@opentrons/api-client'

/**
 * prepares object to send to endpoints requiring RunTimeParameterFilesCreateData
 * @param {RunTimeParameter[]} runTimeParameters array of updated RunTimeParameter overrides
 * @param {Record<string, string>} [fileIdMap] mapping of variable name to file ID created and returned by robot server
 * @returns {RunTimeParameterFilesCreateData} object mapping variable name to file ID
 */
export function getRunTimeParameterFilesForRun(
  runTimeParameters: RunTimeParameter[],
  fileIdMap?: Record<string, string>
): RunTimeParameterFilesCreateData {
  return runTimeParameters.reduce((acc, param) => {
    const { variableName } = param
    if (param.type === 'csv_file' && param.file?.id != null) {
      return { ...acc, [variableName]: param.file.id }
    } else if (
      param.type === 'csv_file' &&
      fileIdMap != null &&
      variableName in fileIdMap
    ) {
      return { ...acc, [variableName]: fileIdMap[variableName] }
    }
    return acc
  }, {})
}
