import * as React from 'react'
import { I18nextProvider } from 'react-i18next'
import reduce from 'lodash/reduce'

import { resources } from './assets/localization'
import { i18n, i18nCb, i18nConfig } from './i18n'
import { useFeatureFlag } from './redux/config'

export interface LocalizationProviderProps {
  children?: React.ReactNode
}

/**
 * POC: substituting the phrase "Otie Settings" for "App Settings" when enableRunNotes feature flag is on
 * The real thing will create branded.json and anonymous.json
 * And OEM mode will be based on a newly created robot setting
 */

// const BRANDED_RESOURCE = 'branded'
const BRANDED_RESOURCE = 'app_settings'

// const ANONYMOUS_RESOURCE = 'anonymous'
const ANONYMOUS_RESOURCE = 'anon_app_settings'

export function LocalizationProvider(
  props: LocalizationProviderProps
): JSX.Element {
  const isOEMMode = useFeatureFlag('enableRunNotes')

  // iterate through language resources, nested files, substitute anonymous file for branded file for OEM mode
  const anonResources = reduce(
    resources,
    (acc, resource, language) => {
      const anonFiles = reduce(
        resource,
        (acc, file, fileName) => {
          if (fileName === BRANDED_RESOURCE && isOEMMode) {
            return acc
          } else if (fileName === ANONYMOUS_RESOURCE) {
            return isOEMMode ? { ...acc, [BRANDED_RESOURCE]: file } : acc
          } else {
            return { ...acc, [fileName]: file }
          }
        },
        {}
      )
      return { ...acc, [language]: anonFiles }
    },
    {}
  )

  const anonI18n = i18n.createInstance(
    {
      ...i18nConfig,
      resources: anonResources,
    },
    i18nCb
  )

  return <I18nextProvider i18n={anonI18n}>{props.children}</I18nextProvider>
}
