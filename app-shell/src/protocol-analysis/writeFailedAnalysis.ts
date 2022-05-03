import { writeFile } from 'fs/promises'
import uuid from 'uuid/v4'

const UNEXPECTED_ERROR_TYPE = 'UnexpectedAnalysisError'

export function writeFailedAnalysis(
  outputPath: string,
  errorMessage: string
): Promise<void> {
  // TODO(mc, 2022-05-03): add type annotation
  const analysis = {
    errors: [
      {
        id: uuid(),
        errorType: UNEXPECTED_ERROR_TYPE,
        createdAt: new Date().toISOString(),
        detail: errorMessage,
      },
    ],
    files: [],
    config: {},
    metadata: [],
    commands: [],
  }

  return writeFile(outputPath, JSON.stringify(analysis))
}
