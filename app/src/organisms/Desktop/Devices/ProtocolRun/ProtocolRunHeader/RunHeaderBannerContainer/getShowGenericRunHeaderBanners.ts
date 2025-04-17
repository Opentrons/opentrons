import {
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_STOPPED,
} from '@opentrons/api-client'

import { isCancellableStatus } from '../utils'

import type { RunHeaderBannerContainerProps } from '.'
import { DoorResult, NOT_CONFIGURED } from '../hooks/useIsDoorOpen'

interface ShowGenericRunHeaderBannersParams {
  runStatus: RunHeaderBannerContainerProps['runStatus']
  enteredER: RunHeaderBannerContainerProps['enteredER']
  doorStatus: DoorResult
}

interface ShowGenericRunHeaderBannersResult {
  showRunCanceledBanner: boolean
  showDoorOpenDuringRunBanner: boolean
  showDoorOpenBeforeRunBanner: boolean
  showStackerDoorOpenDuringRunBanner: boolean
  showStackerDoorOpenBeforeRunBanner: boolean
  showUnconfiguredStackerDoorOpenDuringRunBanner: boolean
  showUnconfiguredStackerDoorOpenBeforeRunBanner: boolean
}

// Returns the "should render" scalar for all the generic Banner components used by ProtocolRunHeader.
export function getShowGenericRunHeaderBanners({
  runStatus,
  doorStatus,
  enteredER,
}: ShowGenericRunHeaderBannersParams): ShowGenericRunHeaderBannersResult {
  const showRunCanceledBanner = runStatus === RUN_STATUS_STOPPED && !enteredER

  const showDoorOpenBeforeRunBanner =
    doorStatus.isDoorOpen &&
    doorStatus.moduleDoorLocation === null &&
    isCancellableStatus(runStatus) &&
    runStatus !== RUN_STATUS_BLOCKED_BY_OPEN_DOOR &&
    runStatus !== RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR &&
    runStatus !== RUN_STATUS_AWAITING_RECOVERY_PAUSED

  const showUnconfiguredStackerDoorOpenBeforeRunBanner =
    doorStatus.isDoorOpen &&
    doorStatus.moduleDoorLocation === NOT_CONFIGURED &&
    isCancellableStatus(runStatus) &&
    runStatus !== RUN_STATUS_BLOCKED_BY_OPEN_DOOR &&
    runStatus !== RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR &&
    runStatus !== RUN_STATUS_AWAITING_RECOVERY_PAUSED

  const showStackerDoorOpenBeforeRunBanner =
    doorStatus.isDoorOpen &&
    doorStatus.moduleDoorLocation !== null &&
    doorStatus.moduleDoorLocation !== NOT_CONFIGURED &&
    isCancellableStatus(runStatus) &&
    runStatus !== RUN_STATUS_BLOCKED_BY_OPEN_DOOR &&
    runStatus !== RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR &&
    runStatus !== RUN_STATUS_AWAITING_RECOVERY_PAUSED

  const showDoorOpenDuringRunBanner =
    runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR&&
    doorStatus.moduleDoorLocation === null

  const showUnconfiguredStackerDoorOpenDuringRunBanner =
    runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR&&
    doorStatus.moduleDoorLocation === NOT_CONFIGURED

  const showStackerDoorOpenDuringRunBanner =
    runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR &&
    doorStatus.moduleDoorLocation !== null &&
    doorStatus.moduleDoorLocation !== NOT_CONFIGURED

  return {
    showRunCanceledBanner,
    showDoorOpenBeforeRunBanner,
    showDoorOpenDuringRunBanner,
    showStackerDoorOpenDuringRunBanner,
    showStackerDoorOpenBeforeRunBanner,
    showUnconfiguredStackerDoorOpenDuringRunBanner,
    showUnconfiguredStackerDoorOpenBeforeRunBanner,
  }
}
