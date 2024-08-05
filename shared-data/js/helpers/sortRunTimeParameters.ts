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
  return [...runTimeParameters].sort((a, b) =>
    a.type === 'csv_file' && b.type !== 'csv_file' ? -1 : 0
  )
}
