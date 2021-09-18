import * as React from 'react'
import '@testing-library/jest-dom'
import { StaticRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components/__utils__'
import { i18n } from '../../../../i18n'
import * as hooks from '../hooks'
import { ProceedToRunCta } from '../ProceedToRunCta'
import { mockProtocolPipetteTipRackCalInfo } from '../../../../redux/pipettes/__fixtures__'
import { getProtocolPipetteTipRackCalInfo } from '../../../../redux/pipettes'
import type { ProtocolPipetteTipRackCalDataByMount } from '../../../../redux/pipettes/types'

jest.mock('../hooks')
jest.mock('../../../../redux/pipettes/__fixtures__')
jest.mock('../../../../redux/pipettes')
jest.mock('../../../../redux/pipettes/types')

const mockUseMissingModuleIds = hooks.useMissingModuleIds as jest.MockedFunction<
  typeof hooks.useMissingModuleIds
>

const mockGetProtocolPipetteTiprackData = getProtocolPipetteTipRackCalInfo as jest.MockedFunction<
  typeof getProtocolPipetteTipRackCalInfo
>

const mockProtocolPipetteTipRackCalData: ProtocolPipetteTipRackCalDataByMount = {
  left: mockProtocolPipetteTipRackCalInfo,
  right: null,
} as any

const MOCK_PIPETTE_NOT_CALIBRATED = {
  pipetteDisplayName: 'My Pipette',
  exactPipetteMatch: 'match',
  pipetteCalDate: '',
  tipRacks: [
    {
      displayName: 'My TipRack',
      lastModifiedDate: '2021-04-10',
    },
  ],
}
const MOCK_ROBOT_NAME = 'ot-dev'
const render = (props: React.ComponentProps<typeof ProceedToRunCta>) => {
  return renderWithProviders(
    <StaticRouter>
      <ProceedToRunCta {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )
}
describe('ProceedToRunCta', () => {
  let props: React.ComponentProps<typeof ProceedToRunCta>
  beforeEach(() => {
    props = {
      robotName: MOCK_ROBOT_NAME,
    }
    mockGetProtocolPipetteTiprackData.mockReturnValue(
      mockProtocolPipetteTipRackCalData
    )
  })

  it('should br enabled with no tooltip if there are no missing Ids', () => {
    mockUseMissingModuleIds.mockReturnValue([])
    const { getByRole } = render(props)
    expect(typeof ProceedToRunCta).toBe('function')
    const button = getByRole('button', { name: 'Proceed to Run' })
    expect(button).not.toHaveAttribute('disabled')
  })
  it('should be disabled with modules not connected tooltip when there are missing moduleIdd', () => {
    mockUseMissingModuleIds.mockReturnValue(['temperatureModuleV1'])
    const { getByRole } = render(props)
    expect(typeof ProceedToRunCta).toBe('function')
    const button = getByRole('button', { name: 'Proceed to Run' })
    expect(button).toHaveAttribute('disabled')
  })
  it('should be disabled with modules not connected and calibration not completed tooltip if missing cal and moduleIds', () => {
    mockUseMissingModuleIds.mockReturnValue(['temperatureModuleV1'])
    mockGetProtocolPipetteTiprackData.mockReturnValue({
      left: MOCK_PIPETTE_NOT_CALIBRATED,
      right: null,
    } as any)
    const { getByRole } = render(props)
    expect(typeof ProceedToRunCta).toBe('function')
    const button = getByRole('button', { name: 'Proceed to Run' })
    expect(button).toHaveAttribute('disabled')
  })
  it('should be disabled with calibration not complete tooltip', () => {
    mockGetProtocolPipetteTiprackData.mockReturnValue({
      left: MOCK_PIPETTE_NOT_CALIBRATED,
      right: null,
    } as any)
    const { getByRole } = render(props)
    expect(typeof ProceedToRunCta).toBe('function')
    const button = getByRole('button', { name: 'Proceed to Run' })
    expect(button).toHaveAttribute('disabled')
  })
})
