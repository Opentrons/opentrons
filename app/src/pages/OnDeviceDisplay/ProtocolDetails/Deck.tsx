import * as React from 'react'
import last from 'lodash/last'
import { Box, SPACING } from '@opentrons/components'
import { useProtocolAnalysesQuery } from '@opentrons/react-api-client'

import { DeckThumbnail } from '../../../molecules/DeckThumbnail'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

export const Deck = (props: { protocolId: string }): JSX.Element => {
  const { data: protocolAnalyses } = useProtocolAnalysesQuery(
    props.protocolId,
    {
      staleTime: Infinity,
    }
  )
  const mostRecentAnalysis = last(protocolAnalyses?.data ?? []) ?? null

  return (
    <Box margin={`${SPACING.spacing40} 12rem 0`}>
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
    </Box>
  )
}
