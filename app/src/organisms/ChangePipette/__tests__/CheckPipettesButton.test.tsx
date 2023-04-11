import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { usePipettesQuery } from '@opentrons/react-api-client'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CheckPipettesButton } from '../CheckPipettesButton'

jest.mock('@opentrons/react-api-client')

const mockUsePipettesQuery = usePipettesQuery as jest.MockedFunction<
  typeof usePipettesQuery
>
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
      onDone: jest.fn(),
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the confirm attachment btn and clicking on it calls fetchPipettes', () => {
    const refetch = jest.fn(() => Promise.resolve())
    mockUsePipettesQuery.mockReturnValue({
      refetch,
      isFetching: false,
    } as any)
    props = {
      robotName: 'otie',
      onDone: jest.fn(),
      direction: 'attach',
    }
    const { getByLabelText, getByText } = render(props)
    const btn = getByLabelText('Confirm')
    getByText('Confirm attachment')
    fireEvent.click(btn)
    expect(refetch).toHaveBeenCalled()
  })

  it('renders the confirm detachment btn and clicking on it calls fetchPipettes', () => {
    const refetch = jest.fn(() => Promise.resolve())
    mockUsePipettesQuery.mockReturnValue({
      refetch,
      isFetching: false,
    } as any)
    props = {
      robotName: 'otie',
      onDone: jest.fn(),
      direction: 'detach',
    }
    const { getByLabelText, getByText } = render(props)
    const btn = getByLabelText('Confirm')
    getByText('Confirm detachment')
    fireEvent.click(btn)
    expect(refetch).toHaveBeenCalled()
  })

  it('renders button disabled when pipettes query status is loading', () => {
    const refetch = jest.fn(() => Promise.resolve())
    mockUsePipettesQuery.mockReturnValue({
      refetch,
    } as any)
    props = {
      robotName: 'otie',
      onDone: jest.fn(),
    }
    const { getByLabelText } = render(props)
    const btn = getByLabelText('Confirm')
    fireEvent.click(btn)
    expect(getByLabelText('Confirm')).toBeDisabled()
  })

  it('renders the confirm detachment btn and with children and clicking on it calls fetchPipettes', () => {
    const refetch = jest.fn(() => Promise.resolve())
    mockUsePipettesQuery.mockReturnValue({
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
