import * as React from 'react'
import { when } from 'vitest-when'
import { describe, it, beforeEach, vi, afterEach, expect } from 'vitest'
import { screen } from '@testing-library/react'

import { LabwareRender } from '@opentrons/components'
import { parseLiquidsInLoadOrder } from '@opentrons/api-client'

import {
  nestedTextMatcher,
  partialComponentPropsMatcher,
  renderWithProviders,
} from '../../../../../__testing-utils__'
import { i18n } from '../../../../../i18n'
import { getIsOnDevice } from '../../../../../redux/config'
import { useMostRecentCompletedAnalysis } from '../../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { mockDefinition } from '../../../../../redux/custom-labware/__fixtures__'
import { getLocationInfoNames } from '../../utils/getLocationInfoNames'
import { getSlotLabwareDefinition } from '../../utils/getSlotLabwareDefinition'
import { getLiquidsByIdForLabware, getWellFillFromLabwareId } from '../utils'
import { LiquidsLabwareDetailsModal } from '../LiquidsLabwareDetailsModal'
import { LiquidDetailCard } from '../LiquidDetailCard'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

vi.mock('@opentrons/components', () => {
  const actualComponents = vi.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    LabwareRender: vi.fn(() => <div>mock LabwareRender</div>),
  }
})
vi.mock('@opentrons/api-client')
vi.mock('../../../../../redux/config')
vi.mock('../../../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
vi.mock('../../../../Devices/hooks')
vi.mock('../../utils/getLocationInfoNames')
vi.mock('../../utils/getSlotLabwareDefinition')
vi.mock('../utils')
vi.mock('../LiquidDetailCard')

const render = (
  props: React.ComponentProps<typeof LiquidsLabwareDetailsModal>
) => {
  return renderWithProviders(<LiquidsLabwareDetailsModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('LiquidsLabwareDetailsModal', () => {
  let props: React.ComponentProps<typeof LiquidsLabwareDetailsModal>
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = function () {}
    props = {
      liquidId: '4',
      labwareId: '123',
      runId: '456',
      closeModal: jest.fn(),
    }
    vi.mocked(getLocationInfoNames).mockReturnValue({
      labwareName: 'mock labware name',
      slotName: '5',
    })
    vi.mocked(getSlotLabwareDefinition).mockReturnValue(mockDefinition)
    vi.mocked(getLiquidsByIdForLabware).mockReturnValue({
      '4': [
        {
          labwareId: '123',
          volumeByWell: {
            A3: 100,
            A4: 100,
            B3: 100,
            B4: 100,
            C3: 100,
            C4: 100,
            D3: 100,
            D4: 100,
          },
        },
      ],
    })
    vi.mocked(parseLiquidsInLoadOrder).mockReturnValue([
      {
        id: '4',
        displayName: 'liquid 4',
        description: 'saliva',
        displayColor: '#B925FF',
      },
    ])
    vi.mocked(LiquidDetailCard).mockReturnValue(<div></div>)
    vi.mocked(getWellFillFromLabwareId).mockReturnValue({})
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue(
      {} as CompletedProtocolAnalysis
    )
    vi.mocked(getIsOnDevice).mockReturnValue(false)
    when(vi.mocked(LabwareRender))
      .thenReturn(<div></div>) // this (default) empty div will be returned when LabwareRender isn't called with expected props
      .calledWith(
        partialComponentPropsMatcher({
          wellFill: { C1: '#ff4888', C2: '#ff4888' },
        })
      )
      .thenReturn(<div>mock labware render with well fill</div>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should render slot name and labware name', () => {
    const [{ getByText, getAllByText, getByRole }] = render(props)
    getByRole('heading', { name: 'Slot Number' })
    getByText('5')
    getByRole('heading', { name: 'Labware name' })
    getAllByText('mock labware name')
  })
  it('should render LiquidDetailCard when correct props are passed', () => {
    when(vi.mocked(LiquidDetailCard))
      .calledWith(partialComponentPropsMatcher({ liquidId: '4' }))
      .thenReturn(<>mock LiquidDetailCard</>)
    render(props)
    screen.getByText(nestedTextMatcher('mock LiquidDetailCard'))
  })
  it('should render labware render with well fill', () => {
    vi.mocked(getWellFillFromLabwareId).mockReturnValue({
      C1: '#ff4888',
      C2: '#ff4888',
    })
    render(props)
    screen.getByText('mock labware render with well fill')
  })
  it('should render labware render with well fill on odd', () => {
    vi.mocked(getIsOnDevice).mockReturnValue(true)
    vi.mocked(getWellFillFromLabwareId).mockReturnValue({
      C1: '#ff4888',
      C2: '#ff4888',
    })
    render(props)
    screen.getByText('mock labware render with well fill')
  })
})
