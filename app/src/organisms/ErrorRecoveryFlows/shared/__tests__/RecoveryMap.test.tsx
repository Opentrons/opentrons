import * as React from 'react'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'

import { BaseDeck } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../../__testing-utils__'
import { mockRecoveryContentProps } from '../../__fixtures__'
import { i18n } from '../../../../i18n'
import { RecoveryMap } from '../RecoveryMap'

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof BaseDeck>()
  return {
    ...actual,
    BaseDeck: vi
      .fn()
      .mockImplementation(props => <div {...props}>MOCK_BASE_DECK</div>),
  }
})

const render = (props: React.ComponentProps<typeof RecoveryMap>) => {
  return renderWithProviders(<RecoveryMap {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RecoveryMap', () => {
  let props: React.ComponentProps<typeof RecoveryMap>
  const mockDeckConfig = 'MOCK_DECK_CONFIG'
  const mockRunCurrentModules = 'MOCK_RUN_MODULES'
  const mockRunCurrentLw = 'MOCK_RUN_LW'

  const mockRecoveryMapUtils = {
    deckConfig: mockDeckConfig,
    runCurrentModules: mockRunCurrentModules,
    runCurrentLabware: mockRunCurrentLw,
  } as any

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
      recoveryMapUtils: mockRecoveryMapUtils,
    }
  })

  it('renders the BaseDeck with appropriate props when on ODD', () => {
    render(props)

    screen.getByText('MOCK_BASE_DECK')
    expect(vi.mocked(BaseDeck)).toHaveBeenCalledWith(
      {
        deckConfig: mockDeckConfig,
        robotType: FLEX_ROBOT_TYPE,
        modulesOnDeck: mockRunCurrentModules,
        labwareOnDeck: mockRunCurrentLw,
      },
      {}
    )
  })
})
