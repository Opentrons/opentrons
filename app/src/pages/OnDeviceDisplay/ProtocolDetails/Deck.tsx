import * as React from 'react'
import last from 'lodash/last'
import { useProtocolAnalysesQuery } from '@opentrons/react-api-client'

import { DeckThumbnail } from '../../../molecules/DeckThumbnail'

export const Deck = (props: { protocolId: string }): JSX.Element => {
  const { data: protocolAnalyses } = useProtocolAnalysesQuery(props.protocolId, {
    staleTime: Infinity,
  })
  const mostRecentAnalysis = last(protocolAnalyses?.data ?? []) ?? null

  return (
    <DeckThumbnail
      commands={mostRecentAnalysis?.commands ?? []}
      labware={mostRecentAnalysis?.labware ?? []}
      liquids={
        mostRecentAnalysis?.liquids != null ? mostRecentAnalysis?.liquids : []
      }
    />
  )
}
