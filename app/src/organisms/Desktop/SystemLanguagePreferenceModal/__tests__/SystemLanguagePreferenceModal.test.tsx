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

const MOCK_SYSTEM_LANGUAGE = 'en'

describe('SystemLanguagePreferenceModal', () => {
  beforeEach(() => {
    vi.mocked(getAppLanguage).mockReturnValue(MOCK_SYSTEM_LANGUAGE)
    vi.mocked(getSystemLanguage).mockReturnValue(MOCK_SYSTEM_LANGUAGE)
    vi.mocked(getStoredSystemLanguage).mockReturnValue(MOCK_SYSTEM_LANGUAGE)
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
    expect(
      screen.queryByRole('button', { name: 'Use system language' })
    ).toBeNull()
  })

  it('should render the correct header, description, and buttons on first boot', () => {
    vi.mocked(getAppLanguage).mockReturnValue(null)

    render()

    screen.getByText('System language preferences')
    screen.getByText(
      'Would you like to use your system language as the default for the Opentrons App?'
    )
    const secondaryButton = screen.getByRole('button', {
      name: 'Choose different language',
    })
    const primaryButton = screen.getByRole('button', {
      name: 'Use system language',
    })

    fireEvent.click(primaryButton)
    expect(updateConfigValue).toBeCalledWith(
      'language.appLanguage',
      MOCK_SYSTEM_LANGUAGE
    )
    expect(updateConfigValue).toBeCalledWith(
      'language.systemLanguage',
      MOCK_SYSTEM_LANGUAGE
    )
    fireEvent.click(secondaryButton)
    expect(mockNavigate).toBeCalledWith('/app-settings')
  })

  it('should render the correct header, description, and buttons when system language changes', () => {
    vi.mocked(getSystemLanguage).mockReturnValue('zh')

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
      'zh'
    )
    expect(updateConfigValue).toHaveBeenNthCalledWith(
      2,
      'language.systemLanguage',
      'zh'
    )
    fireEvent.click(secondaryButton)
    expect(updateConfigValue).toHaveBeenNthCalledWith(
      3,
      'language.systemLanguage',
      'zh'
    )
  })
})
