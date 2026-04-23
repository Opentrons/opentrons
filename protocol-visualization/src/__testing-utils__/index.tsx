import { I18nextProvider, initReactI18next } from 'react-i18next'
import { render } from '@testing-library/react'
import i18n from 'i18next'

import type { RenderResult } from '@testing-library/react'

// minimal i18n instance - returns key as value
const testI18n = i18n.createInstance()
testI18n.use(initReactI18next).init({ lng: 'en', resources: {} })

interface RenderOptions {
  i18nInstance?: typeof i18n
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
): RenderResult {
  const i18nInstance = options?.i18nInstance ?? testI18n
  return render(<I18nextProvider i18n={i18nInstance}>{ui}</I18nextProvider>)
}
