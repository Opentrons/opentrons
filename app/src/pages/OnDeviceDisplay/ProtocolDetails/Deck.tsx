import * as React from 'react'
import last from 'lodash/last'

import { Flex } from '@opentrons/components'
import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'

import { DeckThumbnail } from '../../../molecules/DeckThumbnail'

export const Deck = (props: { protocolId: string }): JSX.Element => {
  const { data: protocolData } = useProtocolQuery(props.protocolId)
  const {
    data: mostRecentAnalysis,
  } = useProtocolAnalysisAsDocumentQuery(
    props.protocolId,
    last(protocolData?.data.analysisSummaries)?.id ?? null,
    { enabled: protocolData != null }
  )

  return (
    <Flex height="26.9375rem">
      {mostRecentAnalysis != null ? (
        <DeckThumbnail protocolAnalysis={mostRecentAnalysis} showSlotLabels />
      ) : null}
    </Flex>
  )
}
