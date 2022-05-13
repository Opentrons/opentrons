import * as React from 'react'
import { i18n } from '../../../i18n'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { mockHeaterShaker } from '../../../redux/modules/__fixtures__'
import { HeaterShakerIsRunningModal } from '../HeaterShakerIsRunningModal'
import { HeaterShakerModuleCard } from '../HeaterShakerWizard/HeaterShakerModuleCard'

jest.mock('@opentrons/react-api-client')
jest.mock('../HeaterShakerWizard/HeaterShakerModuleCard')

const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>
const mockHeaterShakerModuleCard = HeaterShakerModuleCard as jest.MockedFunction<
  typeof HeaterShakerModuleCard
>

const render = (
  props: React.ComponentProps<typeof HeaterShakerIsRunningModal>
) => {
  return renderWithProviders(<HeaterShakerIsRunningModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HeaterShakerIsRunningModal', () => {
  let props: React.ComponentProps<typeof HeaterShakerIsRunningModal>
  const mockCreateLiveCommand = jest.fn()
  beforeEach(() => {
    props = {
      closeModal: jest.fn(),
      module: mockHeaterShaker,
      startRun: jest.fn(),
    }
    mockHeaterShakerModuleCard.mockReturnValue(
      <div>mock HeaterShakerModuleCard</div>
    )
    mockCreateLiveCommand.mockResolvedValue(null)
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
  })

  it('renders the correct modal icon and title', () => {
    const { getByText, getByTestId } = render(props)

    getByTestId('HeaterShakerIsRunning_warning_icon')
    getByText('Heater-Shaker Module is currently shaking')
  })

  it('renders the heater shaker module card and prompt', () => {
    const { getByText } = render(props)

    getByText('mock HeaterShakerModuleCard')
    getByText('Continue shaking while the protocol starts?')
  })

  it('renders the stop shaking and start run button and calls the stop run command', () => {
    const { getByRole } = render(props)
    const button = getByRole('button', {
      name: /Stop shaking and start run/i,
    })
    fireEvent.click(button)
    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShakerModule/stopShake',
        params: {
          moduleId: mockHeaterShaker.id,
        },
      },
    })
    expect(props.startRun).toHaveBeenCalled()
    expect(props.closeModal).toHaveBeenCalled()
  })

  it('renders the keep shaking and start run button and calls startRun and closeModal', () => {
    const { getByRole } = render(props)
    const button = getByRole('button', {
      name: /Keep shaking and start run/i,
    })
    fireEvent.click(button)
    expect(props.startRun).toHaveBeenCalled()
    expect(props.closeModal).toHaveBeenCalled()
  })
})
