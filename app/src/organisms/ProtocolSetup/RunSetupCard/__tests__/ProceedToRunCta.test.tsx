import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { StaticRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { useTrackEvent } from '../../../../redux/analytics'
import { i18n } from '../../../../i18n'
import heaterShakerCommands from '@opentrons/shared-data/protocol/fixtures/6/heaterShakerCommands.json'
import { ConfirmAttachmentModal } from '../../../Devices/ModuleCard/ConfirmAttachmentModal'
import { useHeaterShakerFromProtocol } from '../../../Devices/ModuleCard/hooks'
import * as hooks from '../hooks'
import { ProceedToRunCta } from '../ProceedToRunCta'

import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'

import type { ProtocolModuleInfo } from '../../utils/getProtocolModulesInfo'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    Tooltip: jest.fn(({ children }) => <div>{children}</div>),
  }
})
jest.mock('../../../../redux/protocol')
jest.mock('../../../../redux/analytics')
jest.mock('../hooks')
jest.mock('../../../Devices/ModuleCard/ConfirmAttachmentModal')
jest.mock('../../../Devices/ModuleCard/hooks')

const mockUseModuleMatchResults = hooks.useModuleMatchResults as jest.MockedFunction<
  typeof hooks.useModuleMatchResults
>
const mockUseProtocolCalibrationStatus = hooks.useProtocolCalibrationStatus as jest.MockedFunction<
  typeof hooks.useProtocolCalibrationStatus
>

const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>

const mockConfirmAttachmentModal = ConfirmAttachmentModal as jest.MockedFunction<
  typeof ConfirmAttachmentModal
>

const mockUseHeaterShakerFromProtocol = useHeaterShakerFromProtocol as jest.MockedFunction<
  typeof useHeaterShakerFromProtocol
>

const render = () => {
  return renderWithProviders(
    <StaticRouter>
      <ProceedToRunCta />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
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

let mockTrackEvent: jest.Mock

describe('ProceedToRunCta', () => {
  beforeEach(() => {
    mockUseProtocolCalibrationStatus.mockReturnValue({
      complete: true,
    })
    mockConfirmAttachmentModal.mockReturnValue(
      <div>mock confirm attachment modal</div>
    )
    mockUseHeaterShakerFromProtocol.mockReturnValue(null)
    mockTrackEvent = jest.fn()
    when(mockUseTrackEvent).calledWith().mockReturnValue(mockTrackEvent)
  })
  afterEach(() => {
    jest.restoreAllMocks()
    resetAllWhenMocks()
  })

  it('should be enabled with no tooltip if there are no missing Ids', () => {
    mockUseModuleMatchResults.mockReturnValue({
      missingModuleIds: [],
      remainingAttachedModules: [],
    })

    const { getByRole } = render()
    const button = getByRole('button', { name: 'Proceed to Run' })
    expect(button).not.toBeDisabled()
  })

  it('should track a mixpanel event when clicked', () => {
    mockUseModuleMatchResults.mockReturnValue({
      missingModuleIds: [],
      remainingAttachedModules: [],
    })
    const { getByRole } = render()
    const button = getByRole('button', { name: 'Proceed to Run' })
    fireEvent.click(button)
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: 'proceedToRun',
      properties: {},
    })
  })

  it('should be disabled with modules not connected tooltip when there are missing moduleIds', () => {
    mockUseModuleMatchResults.mockReturnValue({
      missingModuleIds: ['temperatureModuleV1'],
      remainingAttachedModules: [],
    })
    const { getByRole, getByText } = render()
    const button = getByRole('button', { name: 'Proceed to Run' })
    expect(button).toBeDisabled()
    getByText('Make sure all modules are connected before proceeding to run')
  })
  it('should be disabled with modules not connected and calibration not completed tooltip if missing cal and moduleIds', async () => {
    mockUseModuleMatchResults.mockReturnValue({
      missingModuleIds: ['temperatureModuleV1'],
      remainingAttachedModules: [],
    })
    mockUseProtocolCalibrationStatus.mockReturnValue({
      complete: false,
    } as any)
    const { getByRole, getByText } = render()
    const button = getByRole('button', { name: 'Proceed to Run' })
    expect(button).toBeDisabled()
    getByText(
      'Make sure robot calibration is complete and all modules are connected before proceeding to run'
    )
  })
  it('should be disabled with calibration not complete tooltip', async () => {
    mockUseModuleMatchResults.mockReturnValue({
      missingModuleIds: [],
      remainingAttachedModules: [],
    })
    mockUseProtocolCalibrationStatus.mockReturnValue({
      complete: false,
    } as any)
    const { getByRole, getByText } = render()
    const button = getByRole('button', { name: 'Proceed to Run' })
    expect(button).toBeDisabled()
    getByText(
      'Make sure robot calibration is complete before proceeding to run'
    )
  })

  it('should be disabled with module not attached but heater shaker attached', async () => {
    mockUseHeaterShakerFromProtocol.mockReturnValue(
      HEATER_SHAKER_PROTOCOL_MODULE_INFO
    )
    mockUseModuleMatchResults.mockReturnValue({
      missingModuleIds: ['temperatureModuleV1'],
      remainingAttachedModules: [],
    })
    mockUseProtocolCalibrationStatus.mockReturnValue({
      complete: true,
    } as any)
    const { getByRole, getByText } = render()
    const button = getByRole('button', { name: 'Proceed to Run' })
    expect(button).toBeDisabled()
    getByText('Make sure all modules are connected before proceeding to run')
  })

  it('should render cta enabled and go to heater shaker modal when clicked', async () => {
    mockUseHeaterShakerFromProtocol.mockReturnValue(
      HEATER_SHAKER_PROTOCOL_MODULE_INFO
    )
    mockUseModuleMatchResults.mockReturnValue({
      missingModuleIds: [],
      remainingAttachedModules: [],
    })
    mockUseProtocolCalibrationStatus.mockReturnValue({
      complete: true,
    } as any)
    const { getByRole, getByText } = render()
    const button = getByRole('button', { name: 'Proceed to Run' })
    expect(button).not.toBeDisabled()
    fireEvent.click(button)
    getByText('mock confirm attachment modal')
  })
})
