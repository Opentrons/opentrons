import * as React from 'react'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components/__utils__'
import withModulesProtocol from '@opentrons/shared-data/protocol/fixtures/4/testModulesProtocol.json'

import { i18n } from '../../../i18n'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import * as calibrationSelectors from '../../../redux/calibration/selectors'
import * as discoverySelectors from '../../../redux/discovery/selectors'
import * as protocolSelectors from '../../../redux/protocol/selectors'
import * as protocolUtils from '../../../redux/protocol/utils'
import { closeProtocol } from '../../../redux/protocol/actions'
import { mockCalibrationStatus } from '../../../redux/calibration/__fixtures__'
import { ProtocolUpload } from '..'

jest.mock('../../../redux/protocol/selectors')
jest.mock('../../../redux/protocol/utils')
jest.mock('../../../redux/discovery/selectors')
jest.mock('../../../redux/calibration/selectors')

const getProtocolFile = protocolSelectors.getProtocolFile as jest.MockedFunction<
  typeof protocolSelectors.getProtocolFile
>
const getProtocolName = protocolSelectors.getProtocolName as jest.MockedFunction<
  typeof protocolSelectors.getProtocolName
>
const ingestProtocolFile = protocolUtils.ingestProtocolFile as jest.MockedFunction<
  typeof protocolUtils.ingestProtocolFile
>
const getConnectedRobot = discoverySelectors.getConnectedRobot as jest.MockedFunction<
  typeof discoverySelectors.getConnectedRobot
>

const getCalibrationStatus = calibrationSelectors.getCalibrationStatus as jest.MockedFunction<
  typeof calibrationSelectors.getCalibrationStatus
>

describe('ProtocolUpload', () => {
  let render: () => ReturnType<typeof renderWithProviders>

  beforeEach(() => {
    getConnectedRobot.mockReturnValue(mockConnectedRobot)
    getProtocolFile.mockReturnValue(null)
    getProtocolName.mockReturnValue(null)
    getCalibrationStatus.mockReturnValue(mockCalibrationStatus)
    ingestProtocolFile.mockImplementation((_f, _s, _e) => {})
    render = () => {
      return renderWithProviders(<ProtocolUpload />, { i18nInstance: i18n })
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders Protocol Upload Input for empty state', () => {
    const { getByRole, queryByText } = render()

    expect(getByRole('button', { name: 'Choose File...' })).toBeTruthy()
    expect(queryByText('Organization/Author')).toBeNull()
  })
  it('renders Protocol Setup if file loaded', () => {
    getProtocolFile.mockReturnValue({ metadata: {} } as any)
    getProtocolName.mockReturnValue('some file name')
    const { queryByRole, getByText } = render()

    expect(queryByRole('button', { name: 'Choose File...' })).toBeNull()
    expect(getByText('Organization/Author')).toBeTruthy()
  })
  it('handles closing protocol', () => {
    getProtocolFile.mockReturnValue(withModulesProtocol as any)
    getProtocolName.mockReturnValue('some file name')
    const { store, getByRole } = render()

    fireEvent.click(getByRole('button', { name: 'close' }))
    expect(store.dispatch).toHaveBeenCalledWith(closeProtocol())
  })
  it('calls ingest protocol if handleUpload', () => {
    const { getByTestId } = render()

    const protocolFile = new File(
      [JSON.stringify(withModulesProtocol)],
      'fixture_protocol.json'
    )
    const input = getByTestId('file_input')
    fireEvent.change(input, { target: { files: [protocolFile] } })
    expect(ingestProtocolFile).toHaveBeenCalledWith(
      protocolFile,
      expect.any(Function),
      expect.any(Function)
    )
  })
})
