import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { getRobotSettings, fetchSettings } from '../../../redux/robot-settings'

import type { State, Dispatch } from '../../../redux/types'
import type {
  RobotSettings,
  RobotSettingsField,
} from '../../../redux/robot-settings/types'
import { SettingToggle } from './SettingToggle'

interface RobotSettingsPrivacyProps {
  robotName: string
}

const PRIVACY_SETTINGS = ['disableLogAggregation']

const INFO_BY_SETTING_ID: {
  [id: string]: {
    titleKey: string
    descriptionKey: string
    invert: boolean
  }
} = {
  disableLogAggregation: {
    titleKey: 'share_logs_with_opentrons',
    descriptionKey: 'share_logs_with_opentrons_description',
    invert: true,
  },
}

export function RobotSettingsPrivacy({
  robotName,
}: RobotSettingsPrivacyProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const settings = useSelector<State, RobotSettings>((state: State) =>
    getRobotSettings(state, robotName)
  )
  const privacySettings = settings.filter(({ id }) =>
    PRIVACY_SETTINGS.includes(id)
  )
  const translatedPrivacySettings: Array<
    RobotSettingsField & { invert: boolean }
  > = privacySettings.map(s => {
    const { titleKey, descriptionKey, invert } = INFO_BY_SETTING_ID[s.id]
    return s.id in INFO_BY_SETTING_ID
      ? {
          ...s,
          title: t(titleKey),
          description: t(descriptionKey),
          invert,
        }
      : { ...s, invert: false }
  })

  const dispatch = useDispatch<Dispatch>()

  React.useEffect(() => {
    dispatch(fetchSettings(robotName))
  }, [dispatch, robotName])

  return (
    <>
      {translatedPrivacySettings.map(field => (
        <SettingToggle key={field.id} {...field} robotName={robotName} />
      ))}
    </>
  )
}
