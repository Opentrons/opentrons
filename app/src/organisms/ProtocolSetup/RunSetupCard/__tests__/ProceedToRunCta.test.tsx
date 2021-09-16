import * as React from 'react'
import { StaticRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components/__utils__'
import { i18n } from '../../../../i18n'
import * as hooks from '../hooks'
import { ProceedToRun } from '../proceedToRunCta'
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

const MOCK_ROBOT_NAME = 'ot-dev'
const render = (props: React.ComponentProps<typeof ProceedToRun>) => {
  return renderWithProviders(
    <StaticRouter>
      <ProceedToRun {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )
}
describe('ProceedToRunCta', () => {
  let props: React.ComponentProps<typeof ProceedToRun>
  beforeEach(() => {
    props = {
      robotName: MOCK_ROBOT_NAME,
    }
    mockGetProtocolPipetteTiprackData.mockReturnValue(
      mockProtocolPipetteTipRackCalData
    )
  })

  it('should enabled with no tooltip if there are no missing Ids', () => {
    mockUseMissingModuleIds.mockReturnValue({
      missingModuleIds: [],
    })
    render(props)
    expect(typeof ProceedToRun).toBe('function')
  })
  it('should enabled with a tooltip and a missing Id', () => {
    mockUseMissingModuleIds.mockReturnValue({
      missingModuleIds: ['temperatureModuleV1'],
    })
    render(props)
    expect(typeof ProceedToRun).toBe('function')
  })
})
