import type * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

import {
  i18n,
  US_ENGLISH_DISPLAY_NAME,
  US_ENGLISH,
  SIMPLIFIED_CHINESE_DISPLAY_NAME,
  SIMPLIFIED_CHINESE,
} from '/app/i18n'
import { getAppLanguage, updateConfigValue } from '/app/redux/config'
import { renderWithProviders } from '/app/__testing-utils__'

import { LanguageSetting } from '../LanguageSetting'

vi.mock('/app/redux/config')

const mockSetCurrentOption = vi.fn()

const render = (props: React.ComponentProps<typeof LanguageSetting>) => {
  return renderWithProviders(<LanguageSetting {...props} />, {
    i18nInstance: i18n,
  })
}

describe('LanguageSetting', () => {
  let props: React.ComponentProps<typeof LanguageSetting>
  beforeEach(() => {
    props = {
      setCurrentOption: mockSetCurrentOption,
    }
    vi.mocked(getAppLanguage).mockReturnValue(US_ENGLISH)
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Language')
    screen.getByText(US_ENGLISH_DISPLAY_NAME)
    screen.getByText(SIMPLIFIED_CHINESE_DISPLAY_NAME)
  })

  it('should call mock function when tapping a language button', () => {
    render(props)
    const button = screen.getByText(SIMPLIFIED_CHINESE_DISPLAY_NAME)
    fireEvent.click(button)
    expect(updateConfigValue).toHaveBeenCalledWith(
      'language.appLanguage',
      SIMPLIFIED_CHINESE
    )
  })

  it('should call mock function when tapping back button', () => {
    render(props)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(props.setCurrentOption).toHaveBeenCalled()
  })
})
