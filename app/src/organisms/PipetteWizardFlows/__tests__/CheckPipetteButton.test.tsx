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
      setPending: jest.fn(),
      isDisabled: false,
      isOnDevice: false,
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
  it('renders button for on device display', () => {
    props = {
      ...props,
      isOnDevice: true,
    }
    const { getByLabelText } = render(props)
    getByLabelText('SmallButton_Default')
  })
  it('renders button disabled when isDisabled is true', () => {
    props = {
      ...props,
      isDisabled: true,
    }
    const { getByRole } = render(props)
    const proceedBtn = getByRole('button', { name: 'continue' })
    expect(proceedBtn).toBeDisabled()
  })
})
