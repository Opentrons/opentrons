import { getPipetteNameSpecs, LEFT } from '@opentrons/shared-data'

import type {
  Run,
  RunTimeParameterFilesCreateData,
  RunTimeParameterValuesCreateData,
} from '@opentrons/api-client'
import type { LoadedPipette } from '@opentrons/shared-data'

// Return the pipetteId for the pipette in the protocol with the fewest channels.
// On a channel-count tie, prefer the left-most mount.
export function getActivePipetteId(pipettes: LoadedPipette[]): string | null {
  if (pipettes.length < 1) {
    console.warn(
      'no pipettes in protocol, cannot determine primary pipette for LPC'
    )
    return null
  } else {
    return pipettes.reduce((acc, pip) => {
      const accChannels = getPipetteNameSpecs(acc.pipetteName)?.channels ?? 0
      const pipChannels = getPipetteNameSpecs(pip.pipetteName)?.channels ?? 0

      if (pipChannels !== accChannels) {
        return pipChannels < accChannels ? pip : acc
      }

      if (pip.mount === LEFT && acc.mount !== LEFT) {
        return pip
      }

      return acc
    }, pipettes[0]).id
  }
}

interface RunTimeParameterData {
  runTimeParameterValues?: RunTimeParameterValuesCreateData
  runTimeParameterFiles?: RunTimeParameterFilesCreateData
}

export const getRunTimeParameterDataFromRun = (
  run: Run
): RunTimeParameterData => {
  const { data: runData } = run ?? {}
  const runTimeParameters =
    runData != null && 'runTimeParameters' in runData
      ? runData.runTimeParameters
      : null
  const runTimeParameterData =
    runTimeParameters?.reduce<RunTimeParameterData>((acc, rtp) => {
      const { variableName } = rtp
      if (rtp.type === 'csv_file') {
        const id = rtp.file?.id
        if (id != null) {
          return 'runTimeParameterFiles' in acc
            ? {
                ...acc,
                runTimeParameterFiles: {
                  ...acc.runTimeParameterFiles,
                  [variableName]: id,
                },
              }
            : { ...acc, runTimeParameterFiles: { [variableName]: id } }
        }
      } else {
        return 'runTimeParameterValues' in acc
          ? {
              ...acc,
              runTimeParameterValues: {
                ...acc.runTimeParameterValues,
                [variableName]: rtp.value,
              },
            }
          : { ...acc, runTimeParameterValues: { [variableName]: rtp.value } }
      }
      return acc
    }, {}) ?? {}
  return runTimeParameterData
}
