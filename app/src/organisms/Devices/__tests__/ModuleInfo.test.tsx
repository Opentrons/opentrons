import React from 'react'
import '@testing-library/jest-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import { ModuleModel, ModuleType } from '@opentrons/shared-data'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { ModuleInfo } from '../ModuleInfo'
import { useRunHasStarted } from '../hooks'

jest.mock('../hooks')

const mockUseRunHasStarted = useRunHasStarted as jest.MockedFunction<
  typeof useRunHasStarted
>

const render = (props: React.ComponentProps<typeof ModuleInfo>) => {
  return renderWithProviders(<ModuleInfo {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockTCModule = {
  labwareOffset: { x: 3, y: 3, z: 3 },
  moduleId: 'TCModuleId',
  model: 'thermocyclerModuleV1' as ModuleModel,
  type: 'thermocyclerModuleType' as ModuleType,
}

const MOCK_RUN_ID = '1'

describe('ModuleInfo', () => {
  let props: React.ComponentProps<typeof ModuleInfo>
  beforeEach(() => {
    props = {
      moduleModel: mockTCModule.model,
      isAttached: false,
      physicalPort: null,
    }
    when(mockUseRunHasStarted).calledWith(MOCK_RUN_ID).mockReturnValue(false)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should show module not connected', () => {
    const { getByText } = render(props)
    getByText('Not connected')
  })

  it('should show module connected and no USB number', () => {
    props = { ...props, isAttached: true }
    const { getByText } = render(props)
    getByText('Connected')
    getByText('USB Port Connected')
  })

  it('should show module connected and USB number', () => {
    props = {
      ...props,
      physicalPort: { port: 1, hub: false, portGroup: 'unknown', path: '' },
      isAttached: true,
    }
    const { getByText } = render(props)
    getByText('Connected')
    getByText('USB Port 1')
  })

  it('should not show module connected when run has started', () => {
    props = {
      ...props,
      physicalPort: { port: 1, hub: false, portGroup: 'unknown', path: '' },
      isAttached: true,
      runId: MOCK_RUN_ID,
    }
    when(mockUseRunHasStarted).calledWith(MOCK_RUN_ID).mockReturnValue(true)
    const { getByText, queryByText } = render(props)
    expect(queryByText('Connected')).toBeNull()
    getByText('Connection info not available once run has started')
  })

  it('should show the correct information when the magnetic block is in the protocol', () => {
    props = {
      ...props,
      moduleModel: 'magneticBlockV1',
    }
    const { getByText, queryByText } = render(props)
    getByText('No USB required')
    expect(queryByText('Connected')).toBeNull()
  })
})
