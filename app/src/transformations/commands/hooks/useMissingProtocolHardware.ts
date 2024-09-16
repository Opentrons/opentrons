import last from 'lodash/last'
import {
  useProtocolQuery,
  useProtocolAnalysisAsDocumentQuery,
} from '@opentrons/react-api-client'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import type { ProtocolHardware } from './types'
import { useRequiredProtocolHardwareFromAnalysis } from './useRequiredProtocolHardwareFromAnalysis'
import { useMissingProtocolHardwareFromRequiredProtocolHardware } from './useMissingProtocolHardwareFromRequiredProtocolHardware'

export const useMissingProtocolHardware = (
  protocolId: string
): {
  missingProtocolHardware: ProtocolHardware[]
  conflictedSlots: string[]
  isLoading: boolean
} => {
  const { data: protocolData } = useProtocolQuery(protocolId)
  const { data: analysis } = useProtocolAnalysisAsDocumentQuery(
    protocolId,
    last(protocolData?.data.analysisSummaries)?.id ?? null,
    { enabled: protocolData != null }
  )
  const {
    requiredProtocolHardware,
    isLoading,
  } = useRequiredProtocolHardwareFromAnalysis(analysis ?? null)

  return useMissingProtocolHardwareFromRequiredProtocolHardware(
    requiredProtocolHardware,
    isLoading,
    FLEX_ROBOT_TYPE,
    analysis ?? null
  )
}
