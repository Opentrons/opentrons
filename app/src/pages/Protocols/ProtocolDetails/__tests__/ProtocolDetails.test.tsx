import * as React from 'react'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { Route, MemoryRouter } from 'react-router-dom'
import { when } from 'vitest-when'
import { renderWithProviders } from '../../../../__testing-utils__'

import { i18n } from '../../../../i18n'
import { getStoredProtocol } from '../../../../redux/protocol-storage'
import { storedProtocolData } from '../../../../redux/protocol-storage/__fixtures__'
import { ProtocolDetails as ProtocolDetailsContents } from '../../../../organisms/ProtocolDetails'

import { ProtocolDetails } from '../'

import type { State } from '../../../../redux/types'

const mockProtocolKey = 'protocolKeyStub'

vi.mock('../../../../redux/protocol-storage')
vi.mock('../../../../organisms/ProtocolDetails')

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
      <Route path="/protocols/:protocolKey">
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
    when(vi.mocked(getStoredProtocol))
      .calledWith(MOCK_STATE, mockProtocolKey)
      .thenReturn(storedProtocolData)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render protocol details', () => {
    render('/protocols/protocolKeyStub')
    expect(vi.mocked(ProtocolDetailsContents)).toHaveBeenCalledWith(
      {
        protocolKey: storedProtocolData.protocolKey,
        modified: storedProtocolData.modified,
        mostRecentAnalysis: storedProtocolData.mostRecentAnalysis,
        srcFileNames: storedProtocolData.srcFileNames,
        srcFiles: storedProtocolData.srcFiles,
      },
      {}
    )
  })

  it('should redirect to protocols landing if there is no protocol', () => {
    when(vi.mocked(getStoredProtocol))
      .calledWith(MOCK_STATE, mockProtocolKey)
      .thenReturn(null)
    const { getByText } = render('/protocols')
    getByText('protocols')
  })
})
