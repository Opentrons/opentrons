import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  pythonImports,
  pythonMetadata,
  pythonRequirements,
} from '@opentrons/step-generation'

import { pythonDef } from './pythonDef'

import type { DeckConfiguration } from '@opentrons/shared-data'
import type { QuickTransferSummaryState } from '../types'

const QUICK_TRANSFER_VERSION = '2.1.1'

export function createQuickTransferPythonFile(
  quickTransferState: QuickTransferSummaryState,
  deckConfig: DeckConfiguration,
  protocolName?: string,
  enableQuickTransferProtocolContentsLog?: boolean
): File {
  const sourceLabwareName = quickTransferState.source.metadata.displayName
  let destinationLabwareName = sourceLabwareName
  if (quickTransferState.destination !== 'source') {
    destinationLabwareName = quickTransferState.destination.metadata.displayName
  }
  const fileMetadata = {
    protocolName:
      protocolName ?? `Quick Transfer ${quickTransferState.volume}µL`,
    description: `This quick transfer moves liquids from a ${sourceLabwareName} to a ${destinationLabwareName}`,
    source: 'Quick Transfer',
    //  see QuickTransferFlow/README.md for versioning details
    version: QUICK_TRANSFER_VERSION,
    category: null,
    subcategory: null,
    tags: [],
  }

  const designerApplication = {
    name: 'opentrons/quick-transfer',
    version: QUICK_TRANSFER_VERSION,
    data: quickTransferState,
  }
  const stringifiedDesignerApplication = JSON.stringify(designerApplication)
  const designerApplicationBlob = `\nDESIGNER_APPLICATION = """${stringifiedDesignerApplication}"""\n`

  const protocolContents =
    [
      pythonImports(),
      pythonMetadata(fileMetadata),
      pythonRequirements(FLEX_ROBOT_TYPE),
      pythonDef(quickTransferState, deckConfig),
      designerApplicationBlob,
    ]
      .filter(section => section)
      .join('\n\n') + '\n'

  // temporary logging for debugging
  if (enableQuickTransferProtocolContentsLog) {
    console.group('🧪 Quick Transfer Protocol Contents')
    console.log(protocolContents)
    const downloadProtocolPython = (): void => {
      const blob = new Blob([protocolContents], { type: 'text/x-python' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const safeName = (protocolName ?? 'protocol name')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()

      link.download = `debug-${safeName}-${Date.now()}.py`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
    ;(window as any).downloadpy = downloadProtocolPython
    console.log('💾 Or copy/paste: downloadpy()')
    console.groupEnd()
  }

  return new File([protocolContents], `${fileMetadata.protocolName}.py`, {
    type: 'text/x-python',
  })
}
