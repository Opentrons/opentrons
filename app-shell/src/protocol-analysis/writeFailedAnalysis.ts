import { writeFile } from 'fs/promises'
import uuid from 'uuid/v4'

import { ProtocolAnalysisOutput } from '@opentrons/shared-data'

const UNEXPECTED_ERROR_TYPE = 'UnexpectedAnalysisError'

export function writeFailedAnalysis(
  outputPath: string,
  errorMessage: string
): Promise<void> {
  const createdAt = new Date().toISOString()

  const analysis: ProtocolAnalysisOutput = {
    createdAt,
    errors: [
      {
        id: uuid(),
        errorType: UNEXPECTED_ERROR_TYPE,
        detail: errorMessage,
        createdAt,
      },
    ],
    files: [],
    metadata: [],
    commands: [],
    // TODO(mc, 2022-05-04): this field does not make sense for an
    // analysis that was unable to complete, but is required by
    // ProtocolAnalysisOutput
    config: {} as any,
  }

  return writeFile(outputPath, JSON.stringify(analysis))
}
