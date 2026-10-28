import { useSelector } from 'react-redux'

import { useRobotSettingsQuery } from '@opentrons/react-api-client'

import { getIsOnDevice } from '/app/redux/config'

import type { RobotSettingsField } from '@opentrons/api-client'

/**
 * a hook to tell the ODD that the robot is in OEM mode
 * limit to ODD, since some instrument name hooks will be common to both ODD and desktop
 * @returns boolean
 */
export function useIsOEMMode(): boolean {
  // Set `enabled: false` to pull from the cache without actually fetching, to avoid
  // reinitializing the localization provider. The actual fetch happens elsewhere
  // (at the time of writing, in the root OnDeviceDisplayApp component).
  const { settings } = useRobotSettingsQuery({ enabled: false }).data ?? {}
  const isOnDevice = useSelector(getIsOnDevice)

  const oemModeSetting =
    (settings ?? []).find(
      (setting: RobotSettingsField) => setting?.id === 'enableOEMMode'
    )?.value ?? false

  return oemModeSetting && isOnDevice
}
