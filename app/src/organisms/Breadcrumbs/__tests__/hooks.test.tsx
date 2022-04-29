import * as React from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { renderHook } from '@testing-library/react-hooks'

import { i18n } from '../../../i18n'
import { usePathCrumbs } from '../hooks'

describe('usePathCrumbs', () => {
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    wrapper = ({ children }) => (
      <I18nextProvider i18n={i18n}>
        <MemoryRouter
          initialEntries={[
            '/devices/litter-hood/protocol-runs/ee82fb80-e647-4097-888d-d6c8a7263d83/run-log',
          ]}
          initialIndex={0}
        >
          {children}
        </MemoryRouter>
      </I18nextProvider>
    )
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
