import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  fetchSettings,
  getRobotSettings,
  updateSetting,
} from '/app/redux/robot-settings'

import type { RobotSettings } from '/app/redux/robot-settings/types'
import type { Dispatch, State } from '/app/redux/types'

const DISABLE_VACUUM_MODULE_WASTE_DETECTION =
  'disableVacuumModuleWasteDetection'

export function useDisableVacuumModuleWasteDetection(robotName: string): {
  wasteDetectionDisabled: boolean
  toggleWasteDetection: () => void
} {
  const [wasteDetectionDisabledCache, setWasteDetectionDisabledCache] =
    useState<boolean>(false)

  const dispatch = useDispatch<Dispatch>()

  const wasteDetectionDisabledFromSettings =
    useSelector<State, RobotSettings>((state: State) =>
      getRobotSettings(state, robotName)
    ).find(setting => setting.id === DISABLE_VACUUM_MODULE_WASTE_DETECTION)
      ?.value === true

  useEffect(() => {
    setWasteDetectionDisabledCache(wasteDetectionDisabledFromSettings)
  }, [wasteDetectionDisabledFromSettings])

  useEffect(() => {
    dispatch(fetchSettings(robotName))
  }, [dispatch, robotName])

  const toggleWasteDetection = (): void => {
    setWasteDetectionDisabledCache(!wasteDetectionDisabledCache)
    dispatch(
      updateSetting(
        robotName,
        DISABLE_VACUUM_MODULE_WASTE_DETECTION,
        !wasteDetectionDisabledCache
      )
    )
  }

  return {
    wasteDetectionDisabled: wasteDetectionDisabledCache,
    toggleWasteDetection,
  }
}
