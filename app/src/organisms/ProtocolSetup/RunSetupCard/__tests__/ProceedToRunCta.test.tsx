import * as React from 'react'
import '@testing-library/jest-dom'
import { StaticRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import * as hooks from '../hooks'
import { ProceedToRunCta } from '../ProceedToRunCta'
import { mockPipetteInfo } from '../../../../redux/pipettes/__fixtures__'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    Tooltip: jest.fn(({ children }) => <div>{children}</div>),
  }
})
jest.mock('../../../../redux/protocol')
jest.mock('../hooks')

const mockUseMissingModuleIds = hooks.useMissingModuleIds as jest.MockedFunction<
  typeof hooks.useMissingModuleIds
>
const mockUseCurrentRunPipetteInfoByMount = hooks.useCurrentRunPipetteInfoByMount as jest.MockedFunction<
  typeof hooks.useCurrentRunPipetteInfoByMount
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
describe('ProceedToRunCta', () => {
  beforeEach(() => {
    mockUseCurrentRunPipetteInfoByMount.mockReturnValue({
      left: mockPipetteInfo,
      right: null,
    })
  })

  it('should be enabled with no tooltip if there are no missing Ids', () => {
    mockUseMissingModuleIds.mockReturnValue([])
    const { getByRole } = render()
    const button = getByRole('button', { name: 'Proceed to Run' })
    expect(button).not.toBeDisabled()
  })

  it('should be disabled with modules not connected tooltip when there are missing moduleIds', () => {
    mockUseMissingModuleIds.mockReturnValue(['temperatureModuleV1'])
    const { getByRole, getByText } = render()
    const button = getByRole('button', { name: 'Proceed to Run' })
    expect(button).toBeDisabled()
    getByText('Make sure all modules are connected before proceeding to run')
  })
  it('should be disabled with modules not connected and calibration not completed tooltip if missing cal and moduleIds', async () => {
    mockUseMissingModuleIds.mockReturnValue(['temperatureModuleV1'])
    mockUseCurrentRunPipetteInfoByMount.mockReturnValue({
      left: { ...mockPipetteInfo, pipetteCalDate: null },
      right: null,
    } as any)
    const { getByRole, getByText } = render()
    const button = getByRole('button', { name: 'Proceed to Run' })
    expect(button).toBeDisabled()
    getByText(
      'Make sure robot calibration is complete and all modules are connected before proceeding to run'
    )
  })
  it('should be disabled with calibration not complete tooltip', async () => {
    mockUseMissingModuleIds.mockReturnValue([])
    mockUseCurrentRunPipetteInfoByMount.mockReturnValue({
      left: { ...mockPipetteInfo, pipetteCalDate: null },
      right: null,
    } as any)
    const { getByRole, getByText } = render()
    const button = getByRole('button', { name: 'Proceed to Run' })
    expect(button).toBeDisabled()
    getByText(
      'Make sure robot calibration is complete before proceeding to run'
    )
  })
})
