import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'
import { i18n } from '/ai-client/i18n'

import { AiAppFallback } from '../AiAppFallback'

import type { FallbackProps } from 'react-error-boundary'

vi.mock('../../analytics/actions')

const mockError = {
  message: 'mock error',
} as Error

const mockFunc = vi.fn()

const render = (props: FallbackProps) => {
  return renderWithProviders(<AiAppFallback {...props} />, {
    i18nInstance: i18n,
  })
}

describe('AiAppFallback', () => {
  let props: FallbackProps

  beforeEach(() => {
    props = {
      error: mockError,
      resetErrorBoundary: mockFunc,
    } as FallbackProps
  })

  it('should render text and button', () => {
    render(props)
    screen.getByText('An unknown error has occurred')
    screen.getByText(
      'You need to reload the app. Contact support with the following error message:'
    )
    screen.getByText('Reload app')
  })

  it('should call mock function when clicking the button', () => {
    render(props)
    fireEvent.click(screen.getByText('Reload app'))
    expect(mockFunc).toHaveBeenCalled()
  })
})
