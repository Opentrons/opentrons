import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { CheckPipetteButton } from '../CheckPipetteButton'
import { waitFor } from '@testing-library/react'

const render = (props: React.ComponentProps<typeof CheckPipetteButton>) => {
  return renderWithProviders(<CheckPipetteButton {...props} />)[0]
}

jest.mock('@opentrons/react-api-client')

const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>

describe('CheckPipetteButton', () => {
  let props: React.ComponentProps<typeof CheckPipetteButton>
  const refetch = jest.fn(() => Promise.resolve())
  beforeEach(() => {
    props = {
      proceed: jest.fn(),
      proceedButtonText: 'continue',
      setFetching: jest.fn(),
      isOnDevice: false,
      isFetching: false,
    }
    mockUseInstrumentsQuery.mockReturnValue({
      refetch,
    } as any)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('clicking on the button calls refetch and proceed', async () => {
    const { getByRole } = render(props)
    getByRole('button', { name: 'continue' }).click()
    expect(refetch).toHaveBeenCalled()
    await waitFor(() => expect(props.proceed).toHaveBeenCalled())
  })
  it('button is disabled when fetching is true', () => {
    const { getByRole } = render({ ...props, isFetching: true })
    expect(getByRole('button', { name: 'continue' })).toBeDisabled()
  })
  it('renders button for on device display', () => {
    props = {
      ...props,
      isOnDevice: true,
    }
    const { getByLabelText } = render(props)
    getByLabelText('SmallButton_primary')
  })
})
