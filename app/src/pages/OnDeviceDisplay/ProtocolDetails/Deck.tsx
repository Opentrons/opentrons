import { DeckThumbnail } from '../../../molecules/DeckThumbnail'
import { useProtocolAnalysesQuery } from '@opentrons/react-api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import last from 'lodash/last'
import * as React from 'react'

export const Deck = (props: { protocolId: string }): JSX.Element => {
  const { data: protocolAnalyses } = useProtocolAnalysesQuery(
    props.protocolId,
    {
      staleTime: Infinity,
    }
  )
  const mostRecentAnalysis = last(protocolAnalyses?.data ?? []) ?? null

  return (
    <DeckThumbnail
      commands={
        (mostRecentAnalysis as CompletedProtocolAnalysis)?.commands ?? []
      }
      labware={(mostRecentAnalysis as CompletedProtocolAnalysis)?.labware ?? []}
      liquids={
        (mostRecentAnalysis as CompletedProtocolAnalysis)?.liquids != null
          ? (mostRecentAnalysis as CompletedProtocolAnalysis)?.liquids
          : []
      }
    />
  )
}
