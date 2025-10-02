import { I18nextProvider, initReactI18next } from 'react-i18next'
import { renderHook } from '@testing-library/react'
import i18n from 'i18next'
import { beforeAll, describe, expect, it } from 'vitest'

import { baseI18nConfig } from '../../i18n'
import { getLatestCommandTypeList } from '../testHelpers'
import { useCommandTypeSummaries } from '../useCommandTypeSummaries'

describe('useCommandTypeSummaries', () => {
  beforeAll(async () => {
    await i18n.use(initReactI18next).init({
      ...baseI18nConfig,
      saveMissing: false, // prevent setPath errors in tests
    })
  })
  it('returns translation when key exists', () => {
    const { result } = renderHook(() => useCommandTypeSummaries('aspirate'), {
      wrapper: ({ children }) => (
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      ),
    })
    expect(result.current).toBe('Aspirate')
  })

  it('returns fallback when key is missing', () => {
    const { result } = renderHook(
      () => useCommandTypeSummaries('heaterShaker/turnUpsideDown' as any),
      {
        wrapper: ({ children }) => (
          <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        ),
      }
    )
    expect(result.current).toBe('Unknown')
  })

  it('returns translations for all command types in the latest schema', async () => {
    const commandTypes = await getLatestCommandTypeList()
    for (const cmd of commandTypes) {
      const { result } = renderHook(() => useCommandTypeSummaries(cmd), {
        wrapper: ({ children }) => (
          <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        ),
      })

      // Make sure it returns something non-empty and not the fallback string
      expect(result.current).toBeDefined()
      expect(result.current).not.toBe('')
      expect(result.current).not.toBe('Unknown')
    }
  })
})
