import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, MemoryRouter, Routes } from 'react-router-dom'
import { when } from 'vitest-when'
import { renderWithProviders } from '/app/__testing-utils__'

import { i18n } from '/app/i18n'
import { getStoredProtocol } from '/app/redux/protocol-storage'
import { storedProtocolData } from '/app/redux/protocol-storage/__fixtures__'
import { ProtocolDetails as ProtocolDetailsContents } from '/app/organisms/Desktop/ProtocolDetails'

import { ProtocolDetails } from '../'

import type { State } from '/app/redux/types'

const mockProtocolKey = 'protocolKeyStub'

vi.mock('/app/redux/protocol-storage')
vi.mock('/app/organisms/Desktop/ProtocolDetails')

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
      <Routes>
        <Route path="/protocols/:protocolKey" element={<ProtocolDetails />} />
        <Route path="/protocols" element={<div>protocols</div>} />
      </Routes>
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
    render('/protocols')
    screen.getByText('protocols')
  })
})
