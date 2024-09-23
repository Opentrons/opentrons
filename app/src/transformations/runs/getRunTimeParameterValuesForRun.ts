import type { RunTimeParameter } from '@opentrons/shared-data'
import type { RunTimeParameterValuesCreateData } from '@opentrons/api-client'

/**
 * prepares object to send to endpoints requiring RunTimeParameterValuesCreateData
 * @param {RunTimeParameter[]} runTimeParameters array of updated RunTimeParameter overrides
 * @returns {RunTimeParameterValuesCreateData} object mapping variable name to value
 */
export function getRunTimeParameterValuesForRun(
  runTimeParameters: RunTimeParameter[]
): RunTimeParameterValuesCreateData {
  return runTimeParameters.reduce((acc, param) => {
    const { variableName } = param
    if (param.type !== 'csv_file' && param.value !== param.default) {
      return { ...acc, [variableName]: param.value }
    }
    return acc
  }, {})
}
