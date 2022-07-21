import * as React from 'react'
import { when } from 'jest-when'
import { i18n } from '../../../../../i18n'
import {
  nestedTextMatcher,
  renderWithProviders,
  partialComponentPropsMatcher,
  LabwareRender,
} from '@opentrons/components'
import { parseLiquidsInLoadOrder } from '@opentrons/api-client'
import {
  getSlotLabwareName,
  getLiquidsByIdForLabware,
  getWellFillFromLabwareId,
} from '../utils'
import {
  useLabwareRenderInfoForRunById,
  useProtocolDetailsForRun,
} from '../../../../Devices/hooks'
import { LiquidsLabwareDetailsModal } from '../LiquidsLabwareDetailsModal'
import { LiquidDetailCard } from '../LiquidDetailCard'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    LabwareRender: jest.fn(() => <div>mock LabwareRender</div>),
  }
})
jest.mock('@opentrons/api-client')
jest.mock('../utils')
jest.mock('../LiquidDetailCard')
jest.mock('../../../../Devices/hooks')

const mockLiquidDetailCard = LiquidDetailCard as jest.MockedFunction<
  typeof LiquidDetailCard
>
const mockGetSlotLabwareName = getSlotLabwareName as jest.MockedFunction<
  typeof getSlotLabwareName
>
const mockGetLiquidsByIdForLabware = getLiquidsByIdForLabware as jest.MockedFunction<
  typeof getLiquidsByIdForLabware
>
const mockParseLiquidsInLoadOrder = parseLiquidsInLoadOrder as jest.MockedFunction<
  typeof parseLiquidsInLoadOrder
>
const mockLabwareRender = LabwareRender as jest.MockedFunction<
  typeof LabwareRender
>
const mockGetWellFillFromLabwareId = getWellFillFromLabwareId as jest.MockedFunction<
  typeof getWellFillFromLabwareId
>
const mockUseLabwareRenderInfoForRunById = useLabwareRenderInfoForRunById as jest.MockedFunction<
  typeof useLabwareRenderInfoForRunById
>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
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
    mockGetSlotLabwareName.mockReturnValue({
      labwareName: 'mock labware name',
      slotName: '5',
    })
    mockGetLiquidsByIdForLabware.mockReturnValue({
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
    mockParseLiquidsInLoadOrder.mockReturnValue([
      {
        liquidId: '4',
        displayName: 'liquid 4',
        description: 'saliva',
        displayColor: '#B925FF',
      },
    ])
    mockLiquidDetailCard.mockReturnValue(<div></div>)
    mockGetWellFillFromLabwareId.mockReturnValue({})
    mockUseLabwareRenderInfoForRunById.mockReturnValue({
      '123': {
        labwareDef: {},
      },
    } as any)
    mockUseProtocolDetailsForRun.mockReturnValue({} as any)

    when(mockLabwareRender)
      .mockReturnValue(<div></div>) // this (default) empty div will be returned when LabwareRender isn't called with expected props
      .calledWith(
        partialComponentPropsMatcher({
          wellFill: { C1: '#ff4888', C2: '#ff4888' },
        })
      )
      .mockReturnValue(<div>mock labware render with well fill</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should render slot name and labware name', () => {
    const [{ getByText, getAllByText, getByRole }] = render(props)
    getByRole('heading', { name: 'Slot Number' })
    getByText('5')
    getByRole('heading', { name: 'Labware Name' })
    getAllByText('mock labware name')
  })
  it('should render LiquidDetailCard when correct props are passed', () => {
    when(mockLiquidDetailCard)
      .calledWith(partialComponentPropsMatcher({ liquidId: '4' }))
      .mockReturnValue(<>mock LiquidDetailCard</>)
    const [{ getByText }] = render(props)
    getByText(nestedTextMatcher('mock LiquidDetailCard'))
  })
  it('should render labware render with well fill', () => {
    mockGetWellFillFromLabwareId.mockReturnValue({
      C1: '#ff4888',
      C2: '#ff4888',
    })
    const [{ getByText }] = render(props)
    getByText('mock labware render with well fill')
  })
})
