import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { vi, it, describe, expect, beforeEach } from 'vitest'

import { usePipettesQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { CheckPipettesButton } from '../CheckPipettesButton'

vi.mock('@opentrons/react-api-client')

const render = (props: React.ComponentProps<typeof CheckPipettesButton>) => {
  return renderWithProviders(<CheckPipettesButton {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('CheckPipettesButton', () => {
  let props: React.ComponentProps<typeof CheckPipettesButton>
  beforeEach(() => {
    props = {
      robotName: 'otie',
      children: <div>btn text</div>,
      onDone: vi.fn(),
    }
  })

  it('renders the confirm attachment btn and clicking on it calls fetchPipettes', () => {
    const refetch = vi.fn(() => Promise.resolve())
    vi.mocked(usePipettesQuery).mockReturnValue({
      refetch,
      isFetching: false,
    } as any)
    props = {
      robotName: 'otie',
      onDone: vi.fn(),
      direction: 'attach',
    }
    const { getByLabelText, getByText } = render(props)
    const btn = getByLabelText('Confirm')
    getByText('Confirm attachment')
    fireEvent.click(btn)
    expect(refetch).toHaveBeenCalled()
  })

  it('renders the confirm detachment btn and clicking on it calls fetchPipettes', () => {
    const refetch = vi.fn(() => Promise.resolve())
    vi.mocked(usePipettesQuery).mockReturnValue({
      refetch,
      isFetching: false,
    } as any)
    props = {
      robotName: 'otie',
      onDone: vi.fn(),
      direction: 'detach',
    }
    const { getByLabelText, getByText } = render(props)
    const btn = getByLabelText('Confirm')
    getByText('Confirm detachment')
    fireEvent.click(btn)
    expect(refetch).toHaveBeenCalled()
  })

  it('renders button disabled when pipettes query status is loading', () => {
    const refetch = vi.fn(() => Promise.resolve())
    vi.mocked(usePipettesQuery).mockReturnValue({
      refetch,
    } as any)
    props = {
      robotName: 'otie',
      onDone: vi.fn(),
    }
    const { getByLabelText } = render(props)
    const btn = getByLabelText('Confirm')
    fireEvent.click(btn)
    expect(getByLabelText('Confirm')).toBeDisabled()
  })

  it('renders the confirm detachment btn and with children and clicking on it calls fetchPipettes', () => {
    const refetch = vi.fn(() => Promise.resolve())
    vi.mocked(usePipettesQuery).mockReturnValue({
      refetch,
      isFetching: false,
    } as any)
    props = {
      ...props,
    }
    const { getByLabelText, getByText } = render(props)
    const btn = getByLabelText('Confirm')
    getByText('btn text')
    fireEvent.click(btn)
    expect(refetch).toHaveBeenCalled()
    expect(getByLabelText('Confirm')).toBeDisabled()
  })
})
