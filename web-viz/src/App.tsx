import { useState } from 'react'

import { VisualizerContainer } from './VisualizerContainer'
import { getGroupedCommands } from './utils/getGroupedCommands'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

import hdqAnalysis from './fixtures/HDQ_DNA_Flex_Multi-Bacteria-analysis.json'

const defaultAnalysis = hdqAnalysis as unknown as ProtocolAnalysisOutput

export function App(): JSX.Element {
  const [analysis, setAnalysis] = useState<ProtocolAnalysisOutput | null>(
    defaultAnalysis
  )
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0]
    if (file == null) return

    const reader = new FileReader()
    reader.onload = e => {
      try {
        const json = JSON.parse(
          e.target?.result as string
        ) as ProtocolAnalysisOutput
        setAnalysis(json)
        setError(null)
      } catch {
        setError('Failed to parse JSON file')
      }
    }
    reader.readAsText(file)
  }

  const groupedCommands =
    analysis != null ? getGroupedCommands(analysis) : null

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid #ccc',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexShrink: 0,
        }}
      >
        <label
          style={{
            cursor: 'pointer',
            padding: '4px 12px',
            border: '1px solid #888',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          Load Analysis JSON
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
        {error != null ? (
          <span style={{ color: 'red', fontSize: '14px' }}>{error}</span>
        ) : null}
        {analysis != null ? (
          <span style={{ fontSize: '14px', color: '#666' }}>
            {analysis.metadata?.protocolName ?? 'Unnamed Protocol'} &mdash;{' '}
            {analysis.commands.length} commands
          </span>
        ) : null}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {analysis != null ? (
          <VisualizerContainer
            analysisOutput={analysis}
            groupedCommands={groupedCommands}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#888',
            }}
          >
            Load a protocol analysis JSON file to visualize
          </div>
        )}
      </div>
    </div>
  )
}
