import { useEffect, useRef } from 'react'
import i18next from 'i18next'

import { registerProtocolVisualizationI18n } from './localization'
import { VisualizerContainer } from './VisualizerContainer'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { GroupedCommands } from './types'

export interface ProtocolVisualizationProps {
  analysis: ProtocolAnalysisOutput
  protocolDisplayName?: string
  groupedCommands?: GroupedCommands | null
  portalRoot?: HTMLElement | null
}

export function ProtocolVisualization(
  props: ProtocolVisualizationProps
): JSX.Element {
  const { analysis, protocolDisplayName, groupedCommands } = props
  const i18nRegistered = useRef(false)

  useEffect(() => {
    if (!i18nRegistered.current) {
      registerProtocolVisualizationI18n(i18next)
      i18nRegistered.current = true
    }
  }, [])

  return (
    <VisualizerContainer
      analysis={analysis}
      protocolDisplayName={protocolDisplayName}
      groupedCommands={groupedCommands}
    />
  )
}
