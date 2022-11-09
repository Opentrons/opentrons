import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  getRobotSettings,
  fetchSettings,
} from '../../../redux/robot-settings'

import type { State, Dispatch } from '../../../redux/types'
import type {
  RobotSettings, RobotSettingsField,
} from '../../../redux/robot-settings/types'
import { SettingToggle } from './SettingToggle'

interface RobotSettingsPrivacyProps {
  robotName: string
}

const PRIVACY_SETTINGS = ['disableLogAggregation']

const TRANSLATION_KEYS_BY_SETTING_ID: { [id: RobotSettingsField['id']]: { titleKey: string, descriptionKey: string } } = {
  disableLogAggregation: {
    titleKey: 'disable_analytics_log_collection',
    descriptionKey: 'disable_analytics_log_collection_description'
  }
}

export function RobotSettingsPrivacy({
  robotName,
}: RobotSettingsPrivacyProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const settings = useSelector<State, RobotSettings>((state: State) =>
    getRobotSettings(state, robotName)
  )
  const privacySettings = settings.filter(
    ({ id }) => PRIVACY_SETTINGS.includes(id)
  )
  const translatedPrivacySettings = privacySettings.map(s => (
    s.id in TRANSLATION_KEYS_BY_SETTING_ID
      ? {
        ...s, 
        title: t(TRANSLATION_KEYS_BY_SETTING_ID[s.id].titleKey),
        description: t(TRANSLATION_KEYS_BY_SETTING_ID[s.id].descriptionKey)
      } : s
  ))

  const dispatch = useDispatch<Dispatch>()

  React.useEffect(() => {
    dispatch(fetchSettings(robotName))
  }, [dispatch, robotName])

  return (
    <>
      {translatedPrivacySettings.map(field => (
        <SettingToggle
          key={field.id}
          {...field}
          robotName={robotName}
        />
      ))}
    </>
  )
}
