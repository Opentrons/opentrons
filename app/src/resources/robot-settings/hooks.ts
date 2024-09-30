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
  // set enabled false to avoid refetch that reinitializes localization provider
  const { settings } = useRobotSettingsQuery({ enabled: false }).data ?? {}
  const isOnDevice = useSelector(getIsOnDevice)

  const oemModeSetting =
    (settings ?? []).find(
      (setting: RobotSettingsField) => setting?.id === 'enableOEMMode'
    )?.value ?? false

  return oemModeSetting && isOnDevice
}
