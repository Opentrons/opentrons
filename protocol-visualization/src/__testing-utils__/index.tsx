import { I18nextProvider, initReactI18next } from 'react-i18next'
import { render, RenderResult } from '@testing-library/react'
import i18n from 'i18next'

// minimal i18n instance - returns key as value
const testI18n = i18n.createInstance()
testI18n.use(initReactI18next).init({ lng: 'en', resources: {} })

export function renderWithProviders(ui: React.ReactElement): RenderResult {
  return render(<I18nextProvider i18n={testI18n}>{ui}</I18nextProvider>)
}
