import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { FAILURE, SUCCESS } from '../../../redux/robot-api'
import { CheckPipetteButton } from '../CheckPipetteButton'
import { useCheckPipettes } from '../hooks'

jest.mock('../hooks')

const mockUseCheckPipettes = useCheckPipettes as jest.MockedFunction<
  typeof useCheckPipettes
>

const render = (props: React.ComponentProps<typeof CheckPipetteButton>) => {
  return renderWithProviders(<CheckPipetteButton {...props} />)[0]
}

describe('CheckPipetteButton', () => {
  let props: React.ComponentProps<typeof CheckPipetteButton>
  const mockCheckPipette = jest.fn()
  beforeEach(() => {
    props = {
      robotName: 'otie',
      proceed: jest.fn(),
      proceedButtonText: 'continue',
      setPending: jest.fn(),
      isDisabled: false,
    }
    mockUseCheckPipettes.mockReturnValue({
      requestStatus: SUCCESS,
      isPending: false,
      handleCheckPipette: mockCheckPipette,
    })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('clicking on the button calls checkPipette success', () => {
    const { getByRole } = render(props)
    getByRole('button', { name: 'continue' }).click()
    expect(mockCheckPipette).toHaveBeenCalled()
  })
  it('clicking on the button calls checkPipette failure', () => {
    mockUseCheckPipettes.mockReturnValue({
      requestStatus: FAILURE,
      isPending: false,
      handleCheckPipette: mockCheckPipette,
    })
    const { getByRole } = render(props)
    getByRole('button', { name: 'continue' }).click()
    expect(mockCheckPipette).toHaveBeenCalled()
  })
  it('renders button disbaled when isDisabled is true', () => {
    props = {
      ...props,
      isDisabled: true,
    }
    const { getByRole } = render(props)
    const proceedBtn = getByRole('button', { name: 'continue' })
    expect(proceedBtn).toBeDisabled()
  })
})
