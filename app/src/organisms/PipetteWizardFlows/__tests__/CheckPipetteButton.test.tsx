import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { usePipettesQuery } from '@opentrons/react-api-client'
import { CheckPipetteButton } from '../CheckPipetteButton'

const render = (props: React.ComponentProps<typeof CheckPipetteButton>) => {
  return renderWithProviders(<CheckPipetteButton {...props} />)[0]
}

jest.mock('@opentrons/react-api-client')

const mockUsePipettesQuery = usePipettesQuery as jest.MockedFunction<
  typeof usePipettesQuery
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
    mockUsePipettesQuery.mockReturnValue({
      refetch,
    } as any)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('clicking on the button calls refetch', () => {
    const { getByRole } = render(props)
    getByRole('button', { name: 'continue' }).click()
    expect(refetch).toHaveBeenCalled()
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
    getByLabelText('SmallButton_default')
  })
})
