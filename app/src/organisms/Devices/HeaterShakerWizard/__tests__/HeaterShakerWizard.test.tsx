import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { MemoryRouter } from 'react-router-dom'
import { i18n } from '../../../../i18n'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'
import heaterShakerCommands from '@opentrons/shared-data/protocol/fixtures/6/heaterShakerCommands.json'
import { RUN_ID_1 } from '../../../RunTimeControl/__fixtures__'
import { HeaterShakerWizard } from '..'
import { Introduction } from '../Introduction'
import { KeyParts } from '../KeyParts'
import { AttachModule } from '../AttachModule'
import { AttachAdapter } from '../AttachAdapter'
import { PowerOn } from '../PowerOn'
import { TestShake } from '../TestShake'

import type { ProtocolModuleInfo } from '../../../Devices/ProtocolRun/utils/getProtocolModulesInfo'

jest.mock('../Introduction')
jest.mock('../KeyParts')
jest.mock('../AttachModule')
jest.mock('../AttachAdapter')
jest.mock('../PowerOn')
jest.mock('../TestShake')

const mockIntroduction = Introduction as jest.MockedFunction<
  typeof Introduction
>
const mockKeyParts = KeyParts as jest.MockedFunction<typeof KeyParts>
const mockAttachModule = AttachModule as jest.MockedFunction<
  typeof AttachModule
>
const mockAttachAdapter = AttachAdapter as jest.MockedFunction<
  typeof AttachAdapter
>
const mockPowerOn = PowerOn as jest.MockedFunction<typeof PowerOn>
const mockTestShake = TestShake as jest.MockedFunction<typeof TestShake>

const render = (
  props: React.ComponentProps<typeof HeaterShakerWizard>,
  path = '/'
) => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <HeaterShakerWizard {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('HeaterShakerWizard', () => {
  let props: React.ComponentProps<typeof HeaterShakerWizard>
  beforeEach(() => {
    props = {
      onCloseClick: jest.fn(),
      attachedModule: mockHeaterShaker,
    }
    mockIntroduction.mockReturnValue(<div>Mock Introduction</div>)
    mockKeyParts.mockReturnValue(<div>Mock Key Parts</div>)
    mockAttachModule.mockReturnValue(<div>Mock Attach Module</div>)
    mockAttachAdapter.mockReturnValue(<div>Mock Attach Adapter</div>)
    mockPowerOn.mockReturnValue(<div>Mock Power On</div>)
    mockTestShake.mockReturnValue(<div>Mock Test Shake</div>)
  })

  it('renders the main modal component of the wizard and exit button is clickable', () => {
    const { getByText, getByLabelText } = render(props)
    getByText(/Attach Heater-Shaker Module/i)
    getByText('Mock Introduction')
    const close = getByLabelText('close')
    fireEvent.click(close)
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  it('renders wizard and returns the correct pages when the buttons are clicked', () => {
    const { getByText, getByRole } = render(props)

    let button = getByRole('button', { name: 'Continue to attachment guide' })
    fireEvent.click(button)
    getByText('Mock Key Parts')

    button = getByRole('button', { name: 'Begin attachment' })
    fireEvent.click(button)
    getByText('Mock Attach Module')

    button = getByRole('button', { name: 'Continue to power on module' })
    fireEvent.click(button)
    getByText('Mock Power On')

    button = getByRole('button', { name: 'Continue to attach thermal adapter' })
    fireEvent.click(button)
    getByText('Mock Attach Adapter')

    button = getByRole('button', { name: 'Continue to test shake' })
    fireEvent.click(button)
    getByText('Mock Test Shake')

    getByRole('button', { name: 'Complete' })
  })

  it('renders wizard and returns the correct pages when the buttons are clicked and protocol is known', () => {
    props = {
      onCloseClick: jest.fn(),
      moduleFromProtocol: {
        moduleId: 'heater_shaker_id',
        x: 0,
        y: 0,
        z: 0,
        moduleDef: mockHeaterShaker as any,
        nestedLabwareDef:
          heaterShakerCommands.labwareDefinitions['example/plate/1'],
        nestedLabwareDisplayName: null,
        nestedLabwareId: null,
        protocolLoadOrder: 1,
        slotName: '1',
      } as ProtocolModuleInfo,
      currentRunId: RUN_ID_1,
      attachedModule: mockHeaterShaker,
    }
    const { getByText, getByRole } = render(props)

    let button = getByRole('button', { name: 'Continue to attachment guide' })
    fireEvent.click(button)
    getByText('Mock Key Parts')

    button = getByRole('button', { name: 'Begin attachment' })
    fireEvent.click(button)
    getByText('Mock Attach Module')

    button = getByRole('button', { name: 'Continue to power on module' })
    fireEvent.click(button)
    getByText('Mock Power On')

    button = getByRole('button', { name: 'Continue to attach thermal adapter' })
    fireEvent.click(button)
    getByText('Mock Attach Adapter')

    button = getByRole('button', { name: 'Continue to test shake' })
    fireEvent.click(button)
    getByText('Mock Test Shake')

    getByRole('button', { name: 'Complete' })
  })

  it('renders power on component and the test shake button is disabled', () => {
    props = {
      ...props,
      attachedModule: null,
    }
    const { getByText, getByRole } = render(props)

    let button = getByRole('button', { name: 'Continue to attachment guide' })
    fireEvent.click(button)
    getByText('Mock Key Parts')

    button = getByRole('button', { name: 'Begin attachment' })
    fireEvent.click(button)
    getByText('Mock Attach Module')

    button = getByRole('button', { name: 'Continue to power on module' })
    fireEvent.click(button)
    getByText('Mock Power On')

    button = getByRole('button', { name: 'Continue to attach thermal adapter' })
    expect(button).toBeDisabled()
  })
})
