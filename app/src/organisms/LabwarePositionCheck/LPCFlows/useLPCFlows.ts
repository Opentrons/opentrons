import { useEffect, useMemo, useState } from 'react'

import { getLabwareDefinitionsFromCommands } from '@opentrons/components'
import {
  useCreateMaintenanceRunLabwareDefinitionMutation,
  useDeleteMaintenanceRunMutation,
} from '@opentrons/react-api-client'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { useMaintenanceRunDocumentation } from '/app/local-resources/access-control/useMaintenanceRunDocumentation'
import { useInitLPCStore } from '/app/organisms/LabwarePositionCheck/LPCFlows/hooks/useInitLPCStore'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import {
  useCreateTargetedMaintenanceRunMutation,
  useMostRecentCompletedAnalysis,
  useNotifyRunQuery,
} from '/app/resources/runs'

import {
  useCompatibleAnalysis,
  useHandleClientAppliedOffsets,
  useLPCLabwareInfo,
  useMonitorMaintenanceRunForDeletion,
  useOffsetConflictTimestamp,
  useUpdateDeckConfig,
  useUpdateLabware,
} from './hooks'
import { useLPCAnalytics } from './useLPCAnalytics'

import type { RobotType } from '@opentrons/shared-data'
import type {
  LegacySupportLPCFlowsProps,
  LPCFlowsProps,
} from '/app/organisms/LabwarePositionCheck/LPCFlows/LPCFlows'

const RUN_RECORD_INTERVAL_MS = 1000 * 5

interface UseLPCFlowsBase {
  showLPC: boolean
  lpcProps: LPCFlowsProps | null
  isLaunchingLPC: boolean
  isFlexLPCInitializing: boolean
  launchLPC: () => Promise<void>
}
interface UseLPCFlowsIdle extends UseLPCFlowsBase {
  showLPC: false
  lpcProps: null
}
interface UseLPCFlowsLaunched extends UseLPCFlowsBase {
  showLPC: true
  lpcProps: LegacySupportLPCFlowsProps
  isLaunchingLPC: false
}
export type UseLPCFlowsResult = UseLPCFlowsIdle | UseLPCFlowsLaunched

export interface UseLPCFlowsProps {
  runId: string | null
  robotType: RobotType
  protocolName: string | undefined
}

export function useLPCFlows({
  runId,
  robotType,
  protocolName,
}: UseLPCFlowsProps): UseLPCFlowsResult {
  const analytics = useLPCAnalytics({
    robotType,
    runId: runId ?? 'UNKNOWN',
  })

  const [maintenanceRunId, setMaintenanceRunId] = useState<string | null>(null)
  const [isLaunching, setIsLaunching] = useState(false)
  const [hasCreatedLPCRun, setHasCreatedLPCRun] = useState(false)

  const { commandDocState, deletionDocState } = useMaintenanceRunDocumentation()

  const isFlex = robotType === FLEX_ROBOT_TYPE
  const deckConfig = useNotifyDeckConfigurationQuery().data
  const { data: runRecord } = useNotifyRunQuery(runId ?? null, {
    refetchInterval: RUN_RECORD_INTERVAL_MS,
  })
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const compatibleFlexAnalysis = useCompatibleAnalysis(
    runId,
    runRecord,
    mostRecentAnalysis,
    isFlex
  )
  const compatibleRobotAnalysis = isFlex
    ? compatibleFlexAnalysis
    : mostRecentAnalysis

  const labwareDefs = useMemo(
    () => {
      const labwareDefsFromCommands = getLabwareDefinitionsFromCommands(
        compatibleRobotAnalysis?.commands ?? []
      )
      return labwareDefsFromCommands
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [compatibleRobotAnalysis?.commands.length]
  )

  const {
    labwareInfo,
    storedOffsets: flexOffsets,
    legacyOffsets: ot2Offsets,
  } = useLPCLabwareInfo({
    labwareDefs,
    protocolData: compatibleRobotAnalysis,
    robotType,
    runId,
  })

  useOffsetConflictTimestamp(isFlex, runId, runRecord)
  useUpdateDeckConfig(isFlex, runId, deckConfig)
  useUpdateLabware(isFlex, runId, maintenanceRunId, labwareInfo)
  useHandleClientAppliedOffsets(isFlex, runId)
  useInitLPCStore({
    runId,
    runRecord,
    analysis: compatibleRobotAnalysis,
    protocolName,
    maintenanceRunId,
    labwareDefs,
    labwareInfo,
    deckConfig,
    isFlex,
    flexStoredOffsets: flexOffsets,
  })

  useMonitorMaintenanceRunForDeletion({ maintenanceRunId, setMaintenanceRunId })

  const { createTargetedMaintenanceRun } =
    useCreateTargetedMaintenanceRunMutation(commandDocState)
  const { createLabwareDefinition } =
    useCreateMaintenanceRunLabwareDefinitionMutation()
  const { deleteMaintenanceRun, isLoading: isClosing } =
    useDeleteMaintenanceRunMutation(deletionDocState)

  // After the maintenance run is created, add labware defs to the maintenance run.
  useEffect(
    () => {
      if (maintenanceRunId != null) {
        void Promise.all(
          labwareDefs.map(def => {
            return createLabwareDefinition({
              maintenanceRunId,
              labwareDef: def,
            })
          })
        )
          .then(() => {
            setHasCreatedLPCRun(true)
          })
          .finally(() => {
            setIsLaunching(false)
          })
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maintenanceRunId]
  )

  const launchLPC = (): Promise<void> => {
    // Avoid accidentally creating several maintenance runs if a request is ongoing.
    if (!isLaunching) {
      analytics.reportLaunchLpcWizard()
      setIsLaunching(true)
      // Inject OT-2 offsets into the maintenance run upon creation.
      // The Flex injects offsets directly in LPC commands and therefore should not load them into the maintenance run.
      const injectedOffsets =
        robotType === OT2_ROBOT_TYPE ? { labwareOffsets: ot2Offsets } : {}

      return createTargetedMaintenanceRun(injectedOffsets).then(
        maintenanceRun => {
          setMaintenanceRunId(maintenanceRun.data.id)
        }
      )
    } else {
      console.warn('Attempted to launch LPC while already launching.')
      return Promise.resolve()
    }
  }

  const handleCloseLPC = (): void => {
    if (maintenanceRunId != null) {
      deleteMaintenanceRun(maintenanceRunId, {
        onSuccess: () => {
          setMaintenanceRunId(null)
          setHasCreatedLPCRun(false)
        },
      })
    }
  }

  const isFlexLPCInitializing = flexOffsets == null

  const showLPC =
    runId != null &&
    hasCreatedLPCRun &&
    maintenanceRunId != null &&
    protocolName != null &&
    compatibleRobotAnalysis != null &&
    deckConfig != null

  return showLPC
    ? {
        launchLPC,
        isLaunchingLPC: false,
        isFlexLPCInitializing,
        showLPC,
        lpcProps: {
          onCloseClick: handleCloseLPC,
          isClosing,
          runId,
          robotType,
          deckConfig,
          labwareDefs,
          labwareInfo,
          analysis: compatibleRobotAnalysis,
          protocolName,
          maintenanceRunId,
          ot2Offsets,
          analytics,
        },
      }
    : {
        launchLPC,
        isLaunchingLPC: isLaunching,
        isFlexLPCInitializing,
        lpcProps: null,
        showLPC,
      }
}
