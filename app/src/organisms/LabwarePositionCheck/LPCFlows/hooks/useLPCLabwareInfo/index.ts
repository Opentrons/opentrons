import { useMemo } from 'react'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'

import { useNotifySearchLabwareOffsets } from '/app/resources/labware_offsets'
import {
  DEFAULT_STATUS_REFETCH_INTERVAL,
  useNotifyRunQuery,
} from '/app/resources/runs'

import { getLPCLabwareInfoFrom } from './getLPCLabwareInfoFrom'
import { getLPCSearchParams } from './getLPCSearchParams'
import { getUniqueValidLwLocationInfoByAnalysis } from './getUniqueValidLwLocationInfoByAnalysis'

import type { StoredLabwareOffset } from '@opentrons/api-client'
import type { LPCLabwareInfo } from '/app/redux/protocol-runs'
import type { GetUniqueValidLwLocationInfoByAnalysisParams } from './getUniqueValidLwLocationInfoByAnalysis'

const REFETCH_OFFSET_SEARCH_MS = 5000

export type UseLPCLabwareInfoProps =
  GetUniqueValidLwLocationInfoByAnalysisParams & {
    runId: string | null
  }

export interface UseLPCLabwareInfoResult {
  labwareInfo: LPCLabwareInfo
  storedOffsets: StoredLabwareOffset[] | undefined
}

// Prepare LPC-able labware info for injection into LPC flows, querying for
// existing offsets in the process.
export function useLPCLabwareInfo({
  labwareDefs,
  protocolData,
  runId,
}: UseLPCLabwareInfoProps): UseLPCLabwareInfoResult {
  const { data: runRecord } = useNotifyRunQuery(runId, {
    refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
  })
  const runStatus = runRecord?.data.status ?? null

  const lwLocationCombos = useMemo(
    () =>
      getUniqueValidLwLocationInfoByAnalysis({
        labwareDefs,
        protocolData,
      }),
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labwareDefs?.length, protocolData?.commands.length]
  )

  const searchLwOffsetsParams = useMemo(
    () => getLPCSearchParams(lwLocationCombos),
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lwLocationCombos.length]
  )

  const { data: lwOffsetsData } = useNotifySearchLabwareOffsets(
    searchLwOffsetsParams,
    {
      enabled:
        runStatus === RUN_STATUS_IDLE &&
        searchLwOffsetsParams?.filters?.length > 0,
      refetchInterval: REFETCH_OFFSET_SEARCH_MS,
    }
  )

  const storedOffsets = useMemo(
    () =>
      lwOffsetsData?.data ??
      (protocolData != null && searchLwOffsetsParams?.filters?.length === 0
        ? []
        : undefined),
    [lwOffsetsData?.data, searchLwOffsetsParams?.filters, protocolData]
  )

  const labwareInfo = useMemo(
    () =>
      getLPCLabwareInfoFrom({
        currentOffsets: storedOffsets,
        lwLocInfo: lwLocationCombos,
        labwareDefs,
        protocolData,
      }),
    [storedOffsets, labwareDefs, lwLocationCombos, protocolData]
  )

  return { labwareInfo, storedOffsets }
}
