import * as React from 'react'
import { Route } from 'react-router'
import { MemoryRouter } from 'react-router-dom'
import { resetAllWhenMocks, when } from 'jest-when'
import {
  componentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { getStoredProtocol } from '../../../../redux/protocol-storage'
import { storedProtocolData } from '../../../../redux/protocol-storage/__fixtures__'
import { ProtocolDetails as ProtocolDetailsContents } from '../../../../organisms/ProtocolDetails'

import { ProtocolDetails } from '../'

import type { State } from '../../../../redux/types'

const mockProtocolKey = 'protocolKeyStub'

jest.mock('../../../../redux/protocol-storage')
jest.mock('../../../../organisms/ProtocolDetails')

const mockGetStoredProtocol = getStoredProtocol as jest.MockedFunction<
  typeof getStoredProtocol
>
const mockProtocolDetailsContents = ProtocolDetailsContents as jest.MockedFunction<
  typeof ProtocolDetailsContents
>

const MOCK_STATE: State = {
  protocolStorage: {
    addFailureFile: null,
    addFailureMessage: null,
    filesByProtocolKey: {
      protocolKeyStub: storedProtocolData,
    },
    inProgressAnalysisProtocolKeys: [],
    protocolKeys: [mockProtocolKey],
  },
} as any

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path="/protocols/protocolKeyStub">
        <ProtocolDetails />
      </Route>
      <Route path="/protocols">
        <div>protocols</div>
      </Route>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
      initialState: MOCK_STATE,
    }
  )[0]
}

describe('ProtocolDetails', () => {
  beforeEach(() => {
    when(mockGetStoredProtocol)
      .calledWith(MOCK_STATE, mockProtocolKey)
      .mockReturnValue(storedProtocolData)
    when(mockProtocolDetailsContents)
      .calledWith(
        componentPropsMatcher({
          protocolKey: storedProtocolData.protocolKey,
          modified: storedProtocolData.modified,
          mostRecentAnalysis: storedProtocolData.mostRecentAnalysis,
          srcFileNames: storedProtocolData.srcFileNames,
          srcFiles: storedProtocolData.srcFiles,
        })
      )
      .mockReturnValue(<div>mock protocol details</div>)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render protocol details', () => {
    const { getByText } = render()
    getByText('mock protocol details')
  })

  it('should redirect to protocols landing if there is no protocol', () => {
    when(mockGetStoredProtocol)
      .calledWith(MOCK_STATE, mockProtocolKey)
      .mockReturnValue(null)
    const { getByText } = render('/protocols')
    getByText('protocols')
  })
})
