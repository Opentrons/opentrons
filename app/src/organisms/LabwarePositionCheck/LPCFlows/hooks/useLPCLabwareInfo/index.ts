import { useMemo } from 'react'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { useNotifySearchLabwareOffsets } from '/app/resources/labware_offsets'
import {
  DEFAULT_STATUS_REFETCH_INTERVAL,
  useNotifyRunQuery,
} from '/app/resources/runs'

import { getLPCLabwareInfoFrom } from './getLPCLabwareInfoFrom'
import { getLPCSearchParams } from './getLPCSearchParams'
import { getUniqueValidLwLocationInfoByAnalysis } from './getUniqueValidLwLocationInfoByAnalysis'

import type { LabwareOffset, StoredLabwareOffset } from '@opentrons/api-client'
import type { RobotType } from '@opentrons/shared-data'
import type { LPCLabwareInfo } from '/app/redux/protocol-runs'
import type { GetUniqueValidLwLocationInfoByAnalysisParams } from './getUniqueValidLwLocationInfoByAnalysis'

const REFETCH_OFFSET_SEARCH_MS = 5000

export type UseLPCLabwareInfoProps =
  GetUniqueValidLwLocationInfoByAnalysisParams & {
    runId: string | null
    robotType: RobotType
  }

export interface UseLPCLabwareInfoResult {
  labwareInfo: LPCLabwareInfo
  storedOffsets: StoredLabwareOffset[] | undefined
  legacyOffsets: LabwareOffset[]
}

// Prepare LPC-able labware info for injection into LPC flows, querying for
// existing offsets in the process. Only relevant network requests and utilities
// are invoked depending on the robot type.
export function useLPCLabwareInfo(
  props: UseLPCLabwareInfoProps
): UseLPCLabwareInfoResult {
  const { legacyOffsets } = useOT2LPCLabwareInfo(props)
  const { labwareInfo, storedOffsets } = useFlexLPCLabwareInfo(props)

  return { storedOffsets, labwareInfo, legacyOffsets }
}

function useFlexLPCLabwareInfo({
  labwareDefs,
  protocolData,
  robotType,
  runId,
}: UseLPCLabwareInfoProps): Pick<
  UseLPCLabwareInfoResult,
  'labwareInfo' | 'storedOffsets'
> {
  const { data: runRecord } = useNotifyRunQuery(runId, {
    refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
  })
  const runStatus = runRecord?.data.status ?? null

  const lwLocationCombos = useMemo(
    () =>
      getUniqueValidLwLocationInfoByAnalysis({
        labwareDefs,
        protocolData,
        robotType,
      }),
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labwareDefs?.length, protocolData?.commands.length, robotType]
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
        robotType === FLEX_ROBOT_TYPE &&
        searchLwOffsetsParams?.filters?.length > 0,
      refetchInterval: REFETCH_OFFSET_SEARCH_MS,
    }
  )
  const storedOffsets = lwOffsetsData?.data

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

function useOT2LPCLabwareInfo({
  runId,
  robotType,
}: UseLPCLabwareInfoProps): Pick<UseLPCLabwareInfoResult, 'legacyOffsets'> {
  const { data: runRecord } = useNotifyRunQuery(runId ?? null, {
    enabled: robotType === OT2_ROBOT_TYPE && runId != null,
  })
  const legacyOffsets = runRecord?.data?.labwareOffsets ?? []

  return { legacyOffsets }
}
