import { format, parseISO } from 'date-fns'
import { INCONSISTENT_PIPETTE_OFFSET } from '@opentrons/api-client'
import type {
  FetchPipettesResponseBody,
  FetchPipettesResponsePipette,
  Mount,
} from '/app/redux/pipettes/types'
import type {
  Instruments,
  PipetteData,
  PipetteOffsetCalibration,
  RunTimeParameterFilesCreateData,
  RunTimeParameterValuesCreateData,
} from '@opentrons/api-client'
import type { RunTimeParameter } from '@opentrons/shared-data'

/**
 * formats a string if it is in ISO 8601 date format
 * @param {string} timestamp ISO date string
 * @returns {string} formatted date string
 */
export function formatTimestamp(timestamp: string): string {
  // eslint-disable-next-line eqeqeq
  return (parseISO(timestamp) as Date | string) != 'Invalid Date'
    ? format(parseISO(timestamp), 'MM/dd/yyyy HH:mm:ss')
    : timestamp
}

export function onDeviceDisplayFormatTimestamp(timestamp: string): string {
  // eslint-disable-next-line eqeqeq
  return (parseISO(timestamp) as Date | string) != 'Invalid Date'
    ? format(parseISO(timestamp), 'HH:mm:ss')
    : timestamp
}

export function downloadFile(data: object | string, fileName: string): void {
  // Create a blob with the data we want to download as a file
  const blobContent = typeof data === 'string' ? data : JSON.stringify(data)
  const blob = new Blob([blobContent], { type: 'text/json' })
  // Create an anchor element and dispatch a click event on it
  // to trigger a download
  const a = document.createElement('a')
  a.download = fileName
  a.href = window.URL.createObjectURL(blob)
  const clickEvt = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
  })
  a.dispatchEvent(clickEvt)
  a.remove()
}

export function getIs96ChannelPipetteAttached(
  leftMountAttachedPipette: FetchPipettesResponsePipette | null
): boolean {
  const pipetteName = leftMountAttachedPipette?.name

  return pipetteName === 'p1000_96'
}

export function getOffsetCalibrationForMount(
  pipetteOffsetCalibrations: PipetteOffsetCalibration[] | null,
  attachedPipettes:
    | FetchPipettesResponseBody
    | { left: undefined; right: undefined },
  mount: Mount
): PipetteOffsetCalibration | null {
  if (pipetteOffsetCalibrations == null) {
    return null
  } else {
    return (
      pipetteOffsetCalibrations.find(
        cal =>
          cal.mount === mount && cal.pipette === attachedPipettes[mount]?.id
      ) || null
    )
  }
}

export function getShowPipetteCalibrationWarning(
  attachedInstruments?: Instruments
): boolean {
  return (
    attachedInstruments?.data.some((i): i is PipetteData => {
      const failuresList =
        i.ok && i.data.calibratedOffset?.reasonability_check_failures != null
          ? i.data.calibratedOffset?.reasonability_check_failures
          : []
      if (failuresList.length > 0) {
        return failuresList[0]?.kind === INCONSISTENT_PIPETTE_OFFSET
      } else return false
    }) ?? false
  )
}

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
