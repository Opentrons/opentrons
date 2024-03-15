import * as React from 'react'
import { I18nextProvider } from 'react-i18next'
// import reduce from 'lodash/reduce'

import { resources } from './assets/localization'
import app_settings from './assets/localization/en/anon_app_settings.json'
import original_app_settings from './assets/localization/en/app_settings.json'
import { i18n, i18nCb, i18nConfig } from './i18n'
import { useFeatureFlag } from './redux/config'

export interface LocalizationProviderProps {
  children?: React.ReactNode
}

// const BRANDED_RESOURCE = 'branded'
const BRANDED_RESOURCE = 'app_settings'

// const ANONYMOUS_RESOURCE = 'anonymous'
const ANONYMOUS_RESOURCE = 'anon_app_settings'

export function LocalizationProvider(
  props: LocalizationProviderProps
): JSX.Element {
  const isOEMMode = useFeatureFlag('enableRunNotes')

  // TODO: iterate through languages, nested resources
  // create branded.json and anon_branded.json
  // alias anon_branded.json as branded

  const anonResources = isOEMMode
    ? { en: { ...resources.en, [BRANDED_RESOURCE]: app_settings } }
    : resources

  // reinitialize i18n with anon_app_settings, aliased as app_settings
  // void i18n.init({ resources: anonResources })

  const currentAppSettings = i18n.getResourceBundle('en', 'app_settings')

  const anonI18n = i18n.createInstance(
    {
      ...i18nConfig,
      resources: anonResources,
    },
    i18nCb
  )

  const anonAppSettings = anonI18n.getResourceBundle('en', 'app_settings')

  console.log(
    'isOEMMode',
    isOEMMode,
    'currentAppSettings',
    currentAppSettings.app_settings,
    'anonAppSettings',
    anonAppSettings.app_settings,
    'original_app_settings',
    original_app_settings.app_settings,
    'anonResources',
    anonResources.en.app_settings.app_settings
  )

  return <I18nextProvider i18n={anonI18n}>{props.children}</I18nextProvider>
}
