import { useNavigate } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, it, vi, afterEach, beforeEach, expect } from 'vitest'
import { when } from 'vitest-when'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import {
  getAppLanguage,
  getStoredSystemLanguage,
  updateConfigValue,
  useFeatureFlag,
} from '/app/redux/config'
import { getSystemLanguage } from '/app/redux/shell'
import { SystemLanguagePreferenceModal } from '..'

vi.mock('react-router-dom')
vi.mock('/app/redux/config')
vi.mock('/app/redux/shell')

const render = () => {
  return renderWithProviders(<SystemLanguagePreferenceModal />, {
    i18nInstance: i18n,
  })[0]
}

const mockNavigate = vi.fn()

const MOCK_DEFAULT_LANGUAGE = 'en-US'

describe('SystemLanguagePreferenceModal', () => {
  beforeEach(() => {
    vi.mocked(getAppLanguage).mockReturnValue(MOCK_DEFAULT_LANGUAGE)
    vi.mocked(getSystemLanguage).mockReturnValue(MOCK_DEFAULT_LANGUAGE)
    vi.mocked(getStoredSystemLanguage).mockReturnValue(MOCK_DEFAULT_LANGUAGE)
    when(vi.mocked(useFeatureFlag))
      .calledWith('enableLocalization')
      .thenReturn(true)
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render null when app language and system language are set', () => {
    render()
    expect(screen.queryByText('Language preference')).toBeNull()
    expect(
      screen.queryByText('Update to your system language preferences')
    ).toBeNull()
  })

  it('should render the correct header, description, and buttons on first boot', () => {
    vi.mocked(getAppLanguage).mockReturnValue(null)

    render()

    screen.getByText('Language preference')
    screen.getByText(
      'The Opentrons App matches your system language unless you select another language below. You can change the language later in the app settings.'
    )
    const primaryButton = screen.getByRole('button', {
      name: 'Continue',
    })

    fireEvent.click(primaryButton)
    expect(updateConfigValue).toBeCalledWith(
      'language.appLanguage',
      MOCK_DEFAULT_LANGUAGE
    )
    expect(updateConfigValue).toBeCalledWith(
      'language.systemLanguage',
      MOCK_DEFAULT_LANGUAGE
    )
  })

  it('should default to English (US) if system language is unsupported', () => {
    vi.mocked(getAppLanguage).mockReturnValue(null)
    vi.mocked(getSystemLanguage).mockReturnValue('es-MX')

    render()

    screen.getByText('Language preference')
    screen.getByText(
      'The Opentrons App matches your system language unless you select another language below. You can change the language later in the app settings.'
    )
    const primaryButton = screen.getByRole('button', {
      name: 'Continue',
    })

    fireEvent.click(primaryButton)
    expect(updateConfigValue).toBeCalledWith(
      'language.appLanguage',
      MOCK_DEFAULT_LANGUAGE
    )
    expect(updateConfigValue).toBeCalledWith('language.systemLanguage', 'es-MX')
  })

  it('should set a supported app language when system language is an unsupported locale of the same language', () => {
    vi.mocked(getAppLanguage).mockReturnValue(null)
    vi.mocked(getSystemLanguage).mockReturnValue('en-GB')

    render()

    screen.getByText('Language preference')
    screen.getByText(
      'The Opentrons App matches your system language unless you select another language below. You can change the language later in the app settings.'
    )
    const primaryButton = screen.getByRole('button', {
      name: 'Continue',
    })

    fireEvent.click(primaryButton)
    expect(updateConfigValue).toBeCalledWith(
      'language.appLanguage',
      MOCK_DEFAULT_LANGUAGE
    )
    expect(updateConfigValue).toBeCalledWith('language.systemLanguage', 'en-GB')
  })

  it('should render the correct header, description, and buttons when system language changes', () => {
    vi.mocked(getSystemLanguage).mockReturnValue('zh-CN')

    render()

    screen.getByText('Update to your system language preferences')
    screen.getByText(
      'Your system’s language was recently updated. Would you like to use the updated language as the default for the Opentrons App?'
    )
    const secondaryButton = screen.getByRole('button', { name: 'Don’t change' })
    const primaryButton = screen.getByRole('button', {
      name: 'Use system language',
    })

    fireEvent.click(primaryButton)
    expect(updateConfigValue).toHaveBeenNthCalledWith(
      1,
      'language.appLanguage',
      'zh-CN'
    )
    expect(updateConfigValue).toHaveBeenNthCalledWith(
      2,
      'language.systemLanguage',
      'zh-CN'
    )
    fireEvent.click(secondaryButton)
    expect(updateConfigValue).toHaveBeenNthCalledWith(
      3,
      'language.systemLanguage',
      'zh-CN'
    )
  })

  it('should set a supported app language when system language changes to an unsupported locale of the same language', () => {
    vi.mocked(getSystemLanguage).mockReturnValue('zh-Hant')

    render()

    const secondaryButton = screen.getByRole('button', { name: 'Don’t change' })
    const primaryButton = screen.getByRole('button', {
      name: 'Use system language',
    })

    fireEvent.click(primaryButton)
    expect(updateConfigValue).toHaveBeenNthCalledWith(
      1,
      'language.appLanguage',
      'zh-CN'
    )
    expect(updateConfigValue).toHaveBeenNthCalledWith(
      2,
      'language.systemLanguage',
      'zh-Hant'
    )
    fireEvent.click(secondaryButton)
    expect(updateConfigValue).toHaveBeenNthCalledWith(
      3,
      'language.systemLanguage',
      'zh-Hant'
    )
  })
})
