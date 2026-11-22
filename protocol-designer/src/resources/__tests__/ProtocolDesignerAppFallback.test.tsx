import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../__testing-utils__'
import { ProtocolDesignerAppFallback } from '../ProtocolDesignerAppFallback'

import type { FallbackProps } from 'react-error-boundary'

import { i18n } from '../../assets/localization'

const mockError = {
  message: 'mock error',
} as Error

const mockFunc = vi.fn()

const render = (props: FallbackProps) => {
  return renderWithProviders(<ProtocolDesignerAppFallback {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolDesignerAppFallback', () => {
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

  it('should call mock function when clicking the button', async () => {
    const user = userEvent.setup()
    render(props)
    await user.click(screen.getByText('Reload app'))
    expect(mockFunc).toHaveBeenCalled()
  })
})
