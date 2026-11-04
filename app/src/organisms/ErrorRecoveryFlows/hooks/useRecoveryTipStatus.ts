import { useRef, useState } from 'react'
import head from 'lodash/head'

import { useRunCurrentState } from '@opentrons/react-api-client'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

import { ERROR_KINDS } from '/app/organisms/ErrorRecoveryFlows/constants'
import { getErrorKind } from '/app/organisms/ErrorRecoveryFlows/utils'
import { useTipAttachmentStatus } from '/app/resources/instruments'

import type {
  Instruments,
  Mount,
  PipetteData,
  Run,
} from '@opentrons/api-client'
import type { ERUtilsProps } from '/app/organisms/ErrorRecoveryFlows/hooks/useERUtils'
import type {
  PipetteWithTip,
  TipAttachmentStatusResult,
} from '/app/resources/instruments'

interface UseRecoveryTipStatusProps {
  runId: string
  failedCommand: ERUtilsProps['failedCommand']
  failedPipetteInfo: PipetteData | null
  attachedInstruments?: Instruments
  runRecord?: Run
}

export type RecoveryTipStatusUtils = TipAttachmentStatusResult & {
  /* Whether the robot is currently determineTipStatus() */
  isLoadingTipStatus: boolean
  runId: string
  gripperErrorFirstPipetteWithTip: string | null
  /* Ignore the current pipette on the next probe so skip can advance to another mount. */
  skipCurrentPipette: () => void
}

// Wraps the tip attachment status utils with Error Recovery specific states and values.
export function useRecoveryTipStatus(
  props: UseRecoveryTipStatusProps
): RecoveryTipStatusUtils {
  const [isLoadingTipStatus, setIsLoadingTipStatus] = useState(false)
  const [failedCommandPipette, setFailedCommandPipette] =
    useState<PipetteWithTip | null>(null)
  const failedCommandPipetteRef = useRef<PipetteWithTip | null>(null)
  const skippedMountsRef = useRef<Mount[]>([])

  const tipAttachmentStatusUtils = useTipAttachmentStatus()

  const setCurrentPipette = (pipette: PipetteWithTip | null): void => {
    failedCommandPipetteRef.current = pipette
    setFailedCommandPipette(pipette)
  }

  const skipCurrentPipette = (): void => {
    const mount = failedCommandPipetteRef.current?.mount
    if (mount != null && !skippedMountsRef.current.includes(mount)) {
      skippedMountsRef.current = [...skippedMountsRef.current, mount]
    }
  }

  const determineTipStatusWithLoading = (): Promise<PipetteWithTip[]> => {
    const { determineTipStatus } = tipAttachmentStatusUtils
    const { failedPipetteInfo } = props
    setIsLoadingTipStatus(true)

    return determineTipStatus().then(pipettesWithTip => {
      const remaining = pipettesWithTip.filter(
        pipette => !skippedMountsRef.current.includes(pipette.mount)
      )
      const specs =
        failedPipetteInfo != null
          ? getPipetteModelSpecs(failedPipetteInfo.instrumentModel)
          : null
      const failedMountSkipped =
        failedPipetteInfo != null &&
        skippedMountsRef.current.includes(failedPipetteInfo.mount)

      // In cases in which determineTipStatus doesn't think a tip could be attached to any pipette, supply the pipette
      // involved in the failed command, if any, unless the user already skipped that mount.
      let pipettesToShow: PipetteWithTip[]
      if (
        remaining.length === 0 &&
        failedPipetteInfo != null &&
        specs != null &&
        !failedMountSkipped
      ) {
        pipettesToShow = [
          {
            mount: failedPipetteInfo.mount,
            specs,
          },
        ]
      } else {
        pipettesToShow = remaining
      }

      setIsLoadingTipStatus(false)
      setCurrentPipette(head(pipettesToShow) ?? null)

      return Promise.resolve(remaining)
    })
  }

  // TODO(jh, 11-15-24): This is temporary. Collaborate with design a better way to do drop tip wizard for multiple
  //  pipettes during error recovery. The tip detection logic will shortly be simplified, too!
  const errorKind = getErrorKind(props.failedCommand)
  const currentTipStates =
    useRunCurrentState(props.runId, {
      enabled: errorKind === ERROR_KINDS.GRIPPER_ERROR,
    }).data?.data.tipStates ?? null

  const gripperErrorFirstPipetteWithTip =
    Object.entries(currentTipStates ?? {}).find(
      ([_, state]) => state.hasTip
    )?.[0] ?? null

  return {
    ...tipAttachmentStatusUtils,
    aPipetteWithTip: failedCommandPipette,
    determineTipStatus: determineTipStatusWithLoading,
    skipCurrentPipette,
    isLoadingTipStatus,
    runId: props.runId,
    gripperErrorFirstPipetteWithTip,
  }
}
