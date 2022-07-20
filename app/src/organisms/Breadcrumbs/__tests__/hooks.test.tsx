import * as React from 'react'
import { I18nextProvider } from 'react-i18next'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { createStore } from 'redux'
import { renderHook } from '@testing-library/react-hooks'

import { i18n } from '../../../i18n'
import { getIsOnDevice } from '../../../redux/config'
import { usePathCrumbs } from '../hooks'

import type { Store } from 'redux'
import type { State } from '../../../redux/types'

jest.mock('../../../redux/config')

const mockGetIsOnDevice = getIsOnDevice as jest.MockedFunction<
  typeof getIsOnDevice
>

describe('usePathCrumbs', () => {
  let wrapper: React.FunctionComponent<{}>
  let store: Store<State>
  beforeEach(() => {
    store = createStore(jest.fn(), {})
    wrapper = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <MemoryRouter
          initialEntries={[
            '/devices/litter-hood/protocol-runs/ee82fb80-e647-4097-888d-d6c8a7263d83/run-log',
          ]}
          initialIndex={0}
        >
          <Provider store={store}>{children}</Provider>
        </MemoryRouter>
      </I18nextProvider>
    )
    mockGetIsOnDevice.mockReturnValue(false)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return a mapped path crumb', () => {
    const { result } = renderHook(usePathCrumbs, { wrapper })
    expect(result.current).toStrictEqual([
      { pathSegment: 'devices', crumbName: 'Devices' },
      { pathSegment: 'litter-hood', crumbName: 'litter-hood' },
      {
        pathSegment: 'ee82fb80-e647-4097-888d-d6c8a7263d83',
        crumbName: 'ee82fb80-e647-4097-888d-d6c8a7263d83',
      },
    ])
  })
})
