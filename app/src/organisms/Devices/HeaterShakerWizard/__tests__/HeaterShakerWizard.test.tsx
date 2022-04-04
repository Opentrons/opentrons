import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { useAttachedModules } from '../../hooks'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'
import heaterShakerCommands from '@opentrons/shared-data/protocol/fixtures/6/heaterShakerCommands.json'
import { HeaterShakerWizard } from '..'
import { Introduction } from '../Introduction'
import { KeyParts } from '../KeyParts'
import { AttachModule } from '../AttachModule'
import { AttachAdapter } from '../AttachAdapter'
import { PowerOn } from '../PowerOn'
import { TestShake } from '../TestShake'

import type { ProtocolModuleInfo } from '../../../ProtocolSetup/utils/getProtocolModulesInfo'

jest.mock('../../../../redux/robot/selectors')
jest.mock('../Introduction')
jest.mock('../KeyParts')
jest.mock('../AttachModule')
jest.mock('../AttachAdapter')
jest.mock('../PowerOn')
jest.mock('../TestShake')
jest.mock('../../hooks')
jest.mock('../../../../redux/modules')
jest.mock('../../ModuleCard/hooks')

const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>

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

const render = (props: React.ComponentProps<typeof HeaterShakerWizard>) => {
  return renderWithProviders(<HeaterShakerWizard {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const HEATER_SHAKER_PROTOCOL_MODULE_INFO = {
  moduleId: 'heater_shaker_id',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: mockHeaterShaker as any,
  nestedLabwareDef: heaterShakerCommands.labwareDefinitions['example/plate/1'],
  nestedLabwareDisplayName: null,
  nestedLabwareId: null,
  protocolLoadOrder: 1,
  slotName: '1',
} as ProtocolModuleInfo

describe('HeaterShakerWizard', () => {
  const props: React.ComponentProps<typeof HeaterShakerWizard> = {
    onCloseClick: jest.fn(),
  }
  beforeEach(() => {
    mockUseAttachedModules.mockReturnValue([mockHeaterShaker])
    mockIntroduction.mockReturnValue(<div>Mock Introduction</div>)
    mockKeyParts.mockReturnValue(<div>Mock Key Parts</div>)
    mockAttachModule.mockReturnValue(<div>Mock Attach Module</div>)
    mockAttachAdapter.mockReturnValue(<div>Mock Attach Adapter</div>)
    mockPowerOn.mockReturnValue(<div>Mock Power On</div>)
    mockTestShake.mockReturnValue(<div>Mock Test Shake</div>)
  })

  it('renders the main modal component of the wizard', () => {
    const { getByText } = render(props)
    getByText(/Attach Heater Shaker Module/i)
    getByText('Mock Introduction')
  })

  it('renders wizard and returns the correct pages when the buttons are clicked with test shake button disabled', () => {
    const { getByText, getByRole } = render(props)

    let button = getByRole('button', { name: 'Continue to attachment guide' })
    fireEvent.click(button)
    getByText('Mock Key Parts')

    button = getByRole('button', { name: 'Begin attachment' })
    fireEvent.click(button)
    getByText('Mock Attach Module')

    button = getByRole('button', { name: 'Continue to attach thermal adapter' })
    fireEvent.click(button)
    getByText('Mock Attach Adapter')

    button = getByRole('button', { name: 'Continue to power on module' })
    fireEvent.click(button)
    getByText('Mock Power On')

    button = getByRole('button', { name: 'Continue to test shake' })
    fireEvent.click(button)
    getByText('Mock Test Shake')

    getByRole('button', { name: 'Complete' })
  })

  it('renders power on component and the test shake button is not disabled', () => {
    mockUseAttachedModules.mockReturnValue([])

    const { getByText, getByRole } = render(props)

    let button = getByRole('button', { name: 'Continue to attachment guide' })
    fireEvent.click(button)
    getByText('Mock Key Parts')

    button = getByRole('button', { name: 'Begin attachment' })
    fireEvent.click(button)
    getByText('Mock Attach Module')

    button = getByRole('button', { name: 'Continue to attach thermal adapter' })
    fireEvent.click(button)
    getByText('Mock Attach Adapter')

    button = getByRole('button', { name: 'Continue to power on module' })
    fireEvent.click(button)
    getByText('Mock Power On')

    button = getByRole('button', { name: 'Continue to test shake' })
    expect(button).toBeDisabled()
  })
})
