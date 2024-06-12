import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, renderHook } from '@testing-library/react'
import { createStore } from 'redux'

import { COLORS } from '@opentrons/components'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { mockFailedCommand } from '../__fixtures__'
import { getIsOnDevice } from '../../../redux/config'
import { useRunPausedSplash, RunPausedSplash } from '../RunPausedSplash'

import type { Store } from 'redux'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'

vi.mock('../../../redux/config')

const store: Store<any> = createStore(vi.fn(), {})

describe('useRunPausedSplash', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
  beforeEach(() => {
    vi.mocked(getIsOnDevice).mockReturnValue(true)
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
  })

  it('returns true if on the ODD', () => {
    const { result } = renderHook(() => useRunPausedSplash(), { wrapper })
    expect(result.current).toEqual(true)
  })
})

const render = (props: React.ComponentProps<typeof RunPausedSplash>) => {
  return renderWithProviders(
    <MemoryRouter>
      <RunPausedSplash {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ConfirmCancelRunModal', () => {
  let props: React.ComponentProps<typeof RunPausedSplash>
  const mockToggleERWiz = vi.fn(() => Promise.resolve())
  const mockProceedToRouteAndStep = vi.fn()
  const mockRouteUpdateActions = {
    proceedToRouteAndStep: mockProceedToRouteAndStep,
  } as any

  beforeEach(() => {
    props = {
      toggleERWiz: mockToggleERWiz,
      routeUpdateActions: mockRouteUpdateActions,
      failedCommand: mockFailedCommand,
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render a generic paused screen if there is no handled errorType', () => {
    render(props)
    screen.getByText('General error')
    screen.getByText('<Placeholder>')
  })

  it('should contain buttons with expected appearance and behavior', async () => {
    render(props)

    const primaryBtn = screen.getByRole('button', {
      name: 'Launch Recovery Mode',
    })
    const secondaryBtn = screen.getByRole('button', { name: 'Cancel run' })

    expect(primaryBtn).toBeInTheDocument()
    expect(secondaryBtn).toBeInTheDocument()

    expect(primaryBtn).toHaveStyle({ 'background-color': 'transparent' })
    expect(secondaryBtn).toHaveStyle({ 'background-color': COLORS.white })

    expect(screen.getByLabelText('remove icon')).toHaveStyle({
      color: COLORS.red50,
    })
    expect(screen.getByLabelText('recovery icon')).toHaveStyle({
      color: COLORS.white,
    })

    fireEvent.click(secondaryBtn)

    await waitFor(() => {
      expect(mockToggleERWiz).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      expect(mockToggleERWiz).toHaveBeenCalledWith(false)
    })
    await waitFor(() => {
      expect(mockProceedToRouteAndStep).toHaveBeenCalledTimes(1)
    })

    expect(mockToggleERWiz.mock.invocationCallOrder[0]).toBeLessThan(
      mockProceedToRouteAndStep.mock.invocationCallOrder[0]
    )

    fireEvent.click(primaryBtn)
    await waitFor(() => {
      expect(mockToggleERWiz).toHaveBeenCalledTimes(2)
    })
    await waitFor(() => {
      expect(mockToggleERWiz).toHaveBeenCalledWith(true)
    })
  })
})
