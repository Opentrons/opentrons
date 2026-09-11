import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { usePostLogMessageMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import {
  i18n,
  SIMPLIFIED_CHINESE,
  SIMPLIFIED_CHINESE_DISPLAY_NAME,
  US_ENGLISH,
  US_ENGLISH_DISPLAY_NAME,
} from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { ANALYTICS_LANGUAGE_UPDATED_ODD_SETTINGS } from '/app/redux/analytics'
import { getAppLanguage, updateConfigValue } from '/app/redux/config'

import { LanguageSetting } from '../LanguageSetting'

import type { ComponentProps } from 'react'
import type * as ReactApiClient from '@opentrons/react-api-client'

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<typeof ReactApiClient>()
  return {
    ...actual,
    usePostLogMessageMutation: vi.fn(),
  }
})
vi.mock('/app/local-resources/access-control/useDocumentationState')
vi.mock('/app/redux/config')
vi.mock('/app/redux-resources/analytics')

const mockSetCurrentOption = vi.fn()
const mockTrackEvent = vi.fn()
const mockPostLogMessage = vi.fn()

const render = (props: ComponentProps<typeof LanguageSetting>) => {
  return renderWithProviders(<LanguageSetting {...props} />, {
    i18nInstance: i18n,
  })
}

describe('LanguageSetting', () => {
  let props: ComponentProps<typeof LanguageSetting>
  beforeEach(() => {
    props = {
      setCurrentOption: mockSetCurrentOption,
    }
    vi.mocked(getAppLanguage).mockReturnValue(US_ENGLISH)
    vi.mocked(useTrackEventWithRobotSerial).mockReturnValue({
      trackEventWithRobotSerial: mockTrackEvent,
    })
    vi.mocked(useDocumentationState).mockReturnValue(
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
    )
    vi.mocked(usePostLogMessageMutation).mockReturnValue({
      postLogMessage: mockPostLogMessage,
    } as any)
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
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_LANGUAGE_UPDATED_ODD_SETTINGS,
      properties: {
        language: SIMPLIFIED_CHINESE,
        transactionId: expect.anything(),
      },
    })
  })

  it('should call mock function when tapping back button', () => {
    render(props)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(props.setCurrentOption).toHaveBeenCalled()
  })
})
