import { I18nextProvider } from 'react-i18next'
import { renderHook } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'

import { i18n } from '../../localization'
import { getLatestCommandTypeList } from '../testHelpers'
import { useCommandTypeSummaries } from '../useCommandTypeSummaries'

describe('useCommandTypeSummaries', () => {
  beforeAll(async () => {
    await i18n.init({
      lng: 'en',
      fallbackLng: 'en',
      resources: i18n.options.resources,
      ns: ['command_type_summary'],
      defaultNS: 'command_type_summary',
      interpolation: i18n.options.interpolation,
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
