import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import {
  Protocol,
  Run,
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
} from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { useCurrentProtocolRun } from '../../ProtocolUpload/hooks'
import { mockFetchModulesSuccessActionPayloadModules } from '../../../redux/modules/__fixtures__'
import {
  mockLeftProtoPipette,
  mockRightProtoPipette,
} from '../../../redux/pipettes/__fixtures__'
import { useAttachedModules, useAttachedPipettes } from '../hooks'
import { RobotCard } from '../RobotCard'

jest.mock('../../ProtocolUpload/hooks')
jest.mock('../hooks')

const OT2_PNG_FILE_NAME = 'OT2-R_HERO.png'

const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>
const mockUseCurrentProtocolRun = useCurrentProtocolRun as jest.MockedFunction<
  typeof useCurrentProtocolRun
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotCard name="otie" local={true} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotCard', () => {
  beforeEach(() => {
    mockUseAttachedModules.mockReturnValue(
      mockFetchModulesSuccessActionPayloadModules
    )
    mockUseAttachedPipettes.mockReturnValue({
      left: mockLeftProtoPipette,
      right: mockRightProtoPipette,
    })
    mockUseCurrentProtocolRun.mockReturnValue({ createProtocolRun: () => {} })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders an OT image', () => {
    const [{ getByRole }] = render()
    const image = getByRole('img')

    expect(image).toBeTruthy()
    expect(image.getAttribute('src')).toEqual(OT2_PNG_FILE_NAME)
  })

  it('renders the type of robot', () => {
    const [{ getByText }] = render()
    expect(getByText('OT-2')).toBeTruthy()
  })

  it('renders the robot name', () => {
    const [{ getByText }] = render()
    expect(getByText('otie')).toBeTruthy()
  })

  it('renders an idle robot status when not running a protocol', () => {
    const [{ getByText }] = render()
    expect(getByText('Idle')).toBeTruthy()
  })

  it('renders an active robot status when a protocol is running', () => {
    mockUseCurrentProtocolRun.mockReturnValue({
      createProtocolRun: () => {},
      runRecord: { data: { status: RUN_STATUS_RUNNING } } as Run,
    })

    const [{ getByText }] = render()

    expect(getByText('Active')).toBeTruthy()
  })

  it('does not render a protocol run banner when a protocol is not running', () => {
    mockUseCurrentProtocolRun.mockReturnValue({
      createProtocolRun: () => {},
      runRecord: { data: { status: RUN_STATUS_IDLE } } as Run,
      protocolRecord: {
        data: { metadata: { protocolName: 'Testosaur' } },
      } as Protocol,
    })

    const [{ queryByText }] = render()

    expect(queryByText('Running Testosaur')).toBeFalsy()

    const runLink = queryByText('Go to Run')
    expect(runLink).toBeFalsy()
  })

  it('renders a protocol run banner when a protocol is running', () => {
    mockUseCurrentProtocolRun.mockReturnValue({
      createProtocolRun: () => {},
      runRecord: { data: { status: RUN_STATUS_RUNNING } } as Run,
      protocolRecord: {
        data: { metadata: { protocolName: 'Testosaur' } },
      } as Protocol,
    })

    const [{ getByText }] = render()

    expect(getByText('Running Testosaur')).toBeTruthy()

    const runLink = getByText('Go to Run')
    expect(runLink).toBeTruthy()
    expect(runLink.getAttribute('href')).toEqual(
      '/devices/otie/protocol-runs/run'
    )
  })

  it('renders the type of pipettes attached to left and right mounts', () => {
    const [{ getByText }] = render()

    expect(getByText('Left Mount')).toBeTruthy()
    expect(getByText('Left Pipette')).toBeTruthy()
    expect(getByText('Right Mount')).toBeTruthy()
    expect(getByText('Right Pipette')).toBeTruthy()
  })

  it('renders a modules section', () => {
    const [{ getByText }] = render()

    expect(getByText('Modules')).toBeTruthy()
  })
})
