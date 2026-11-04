import last from 'lodash/last'

import { Flex, ProtocolDeck, SPACING } from '@opentrons/components'
import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'

import type { ReactNode } from 'react'

export const Deck = (props: { protocolId: string }): ReactNode => {
  const { data: protocolData } = useProtocolQuery(props.protocolId)
  const analysisId = last(protocolData?.data.analysisSummaries)?.id ?? null
  const { data: mostRecentAnalysis } = useProtocolAnalysisAsDocumentQuery(
    props.protocolId,
    analysisId,
    { enabled: protocolData != null && analysisId != null }
  )

  return (
    <>
      <Flex height="26.9375rem" paddingY={SPACING.spacing24}>
        {mostRecentAnalysis != null ? (
          <ProtocolDeck
            protocolAnalysis={mostRecentAnalysis}
            baseDeckProps={{ showSlotLabels: true }}
          />
        ) : null}
      </Flex>
    </>
  )
}
