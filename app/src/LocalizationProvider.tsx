import * as React from 'react'
import { I18nextProvider } from 'react-i18next'
import reduce from 'lodash/reduce'

import { resources } from './assets/localization'
import { useIsOEMMode } from './resources/robot-settings/hooks'
import { i18n, i18nCb, i18nConfig } from './i18n'

export interface OnDeviceLocalizationProviderProps {
  children?: React.ReactNode
}

const BRANDED_RESOURCE = 'branded'
const ANONYMOUS_RESOURCE = 'anonymous'

// TODO(bh, 2024-03-26): anonymization limited to ODD for now, may change in future OEM phases
export function OnDeviceLocalizationProvider(
  props: OnDeviceLocalizationProviderProps
): JSX.Element | null {
  const isOEMMode = useIsOEMMode()

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
