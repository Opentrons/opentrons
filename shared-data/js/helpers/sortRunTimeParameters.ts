import type { RunTimeParameter } from '..'

/**
 * This function sorts an array of runtime parameters. If a parameter of type 'csv_file' exists,
 * it moves it to the beginning of the array.
 *
 * @param runTimeParameters - An array of runtime parameters.
 * @returns A new array of runtime parameters with 'csv_file' type parameter at the beginning if it exists.
 */
export const sortRuntimeParameters = (
  runTimeParameters: RunTimeParameter[]
): RunTimeParameter[] => {
  const copyRunTimeParameters = [...runTimeParameters]
  const csvIndex = copyRunTimeParameters.findIndex(
    param => param.type === 'csv_file'
  )
  if (csvIndex !== -1) {
    const csvParam = copyRunTimeParameters.splice(csvIndex, 1)[0]
    copyRunTimeParameters.unshift(csvParam)
    return copyRunTimeParameters
  }
  return runTimeParameters
}
