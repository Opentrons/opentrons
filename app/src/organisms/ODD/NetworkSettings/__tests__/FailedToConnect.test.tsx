import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { FailedToConnect } from '../FailedToConnect'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof FailedToConnect>) => {
  return renderWithProviders(
    <MemoryRouter>
      <FailedToConnect {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ConnectedResult', () => {
  let props: ComponentProps<typeof FailedToConnect>

  beforeEach(() => {
    props = {
      errorMessage: 'mockError',
      selectedSsid: 'mockSsid',
      handleChangeNetwork: vi.fn(),
      handleTryAgain: vi.fn(),
      isInvalidPassword: true,
    }
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render a failure screen - incorrect password', () => {
    render(props)
    screen.getByText('Oops! Incorrect password for mockSsid')
    screen.getByText('Try again')
    screen.getByText('Change network')
  })

  it('should render a failure screen - other error cases', () => {
    props.isInvalidPassword = false
    render(props)
    screen.getByText('Failed to connect to mockSsid')
    screen.getByText('mockError')
    screen.getByText('Try again')
    screen.getByText('Change network')
  })

  it('should call handleChangeNetwork when pressing Change network', () => {
    render(props)
    const button = screen.getByText('Change network')
    fireEvent.click(button)
    expect(props.handleChangeNetwork).toHaveBeenCalled()
  })

  it('should call handleTryAgain when pressing Try again', () => {
    render(props)
    const button = screen.getByText('Try again')
    fireEvent.click(button)
    expect(props.handleTryAgain).toHaveBeenCalled()
  })
})
