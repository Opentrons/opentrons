import last from 'lodash/last'

import { Flex, ProtocolDeck, SPACING } from '@opentrons/components'
import {
  useProtocolAnalysisAsDocumentQuery,
  useProtocolQuery,
} from '@opentrons/react-api-client'

export const Deck = (props: { transferId: string }): JSX.Element => {
  const { data: transferData } = useProtocolQuery(props.transferId)
  const {
    data: mostRecentAnalysis,
  } = useProtocolAnalysisAsDocumentQuery(
    props.transferId,
    last(transferData?.data.analysisSummaries)?.id ?? null,
    { enabled: transferData != null }
  )

  return (
    <Flex height="26.9375rem" paddingY={SPACING.spacing24}>
      {mostRecentAnalysis != null ? (
        <ProtocolDeck
          protocolAnalysis={mostRecentAnalysis}
          baseDeckProps={{ showSlotLabels: true }}
        />
      ) : null}
    </Flex>
  )
}
