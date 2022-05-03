import execa from 'execa'
import { createLogger } from '../log'

const log = createLogger('protocol-analysis/executeAnalyzeCli')

export function executeAnalyzeCli(
  pythonPath: string,
  sourcePath: string,
  outputPath: string
): Promise<void> {
  return execa(pythonPath, [
    '-m',
    'opentrons.cli',
    'analyze',
    `--jsonOutput=${outputPath}`,
    sourcePath,
  ]).then(output => {
    log.debug('Output from opentrons.cli', { output })
  })
}
