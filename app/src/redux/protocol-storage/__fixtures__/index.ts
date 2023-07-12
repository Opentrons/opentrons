import { simpleAnalysisFileFixture } from '@opentrons/api-client'
import { StoredProtocolData, StoredProtocolDir } from '../types'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

export const storedProtocolData: StoredProtocolData = {
  protocolKey: 'protocolKeyStub',
  mostRecentAnalysis: (simpleAnalysisFileFixture as any) as ProtocolAnalysisOutput,
  srcFileNames: ['fakeSrcFileName'],
  srcFiles: ['fakeSrcFile' as any],
  modified: 123456789,
}

export const storedProtocolDir: StoredProtocolDir = {
  dirPath: 'path/to/protocol/dir',
  modified: 1234556789,
  srcFilePaths: ['path/to/protocol/dir/src/mainFile'],
  analysisFilePaths: ['path/to/protocol/dir/analysis/8675309.json'],
}

export const storedProtocolDataTwo: StoredProtocolData = {
  protocolKey: 'protocolKeyStubTwo',
  mostRecentAnalysis: (simpleAnalysisFileFixture as any) as ProtocolAnalysisOutput,
  srcFileNames: ['fakeSrcFileNameTwo'],
  srcFiles: ['fakeSrcFileTwo' as any],
  modified: 987654321,
}
