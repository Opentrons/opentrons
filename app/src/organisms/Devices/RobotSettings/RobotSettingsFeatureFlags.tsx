import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getRobotSettings, fetchSettings } from '../../../redux/robot-settings'
import type { State, Dispatch } from '../../../redux/types'
import type { RobotSettings } from '../../../redux/robot-settings/types'
import { SettingToggle } from './SettingToggle'

interface RobotSettingsFeatureFlagsProps {
  robotName: string
}

const NON_FEATURE_FLAG_SETTINGS = [
  'enableDoorSafetySwitch',
  'disableHomeOnBoot',
  'deckCalibrationDots',
  'shortFixedTrash',
  'useOldAspirationFunctions',
  'disableLogAggregation',
  'disableFastProtocolUpload',
]

export function RobotSettingsFeatureFlags({
  robotName,
}: RobotSettingsFeatureFlagsProps): JSX.Element {
  const settings = useSelector<State, RobotSettings>((state: State) =>
    getRobotSettings(state, robotName)
  )
  const featureFlags = settings.filter(
    ({ id }) => !NON_FEATURE_FLAG_SETTINGS.includes(id)
  )

  const dispatch = useDispatch<Dispatch>()

  React.useEffect(() => {
    dispatch(fetchSettings(robotName))
  }, [dispatch, robotName])

  return (
    <>
      {featureFlags.map(field => (
        <SettingToggle key={field.id} {...field} robotName={robotName} />
      ))}
    </>
  )
}
