import execa from 'execa'
import { createLogger } from '../log'

const log = createLogger('protocol-analysis/executeAnalyzeCli')

export function executeAnalyzeCli(
  pythonPath: string,
  outputPath: string,
  sourcePaths: string[]
): Promise<void> {
  return execa(pythonPath, [
    '-I',
    '-m',
    'opentrons.cli',
    'analyze',
    `--json-output=${outputPath}`,
    ...sourcePaths,
  ])
    .then(output => {
      log.debug('Output from opentrons.cli', { output })
    })
    .catch(error => {
      const message =
        typeof error.stderr === 'string' && error.stderr !== ''
          ? error.stderr
          : error.message

      throw new Error(message)
    })
}
