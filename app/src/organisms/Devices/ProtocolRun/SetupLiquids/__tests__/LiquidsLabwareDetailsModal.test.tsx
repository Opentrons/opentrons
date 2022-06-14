import * as React from 'react'
import { i18n } from '../../../../../i18n'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import { LiquidsLabwareDetailsModal } from '../LiquidsLabwareDetailsModal'
import { LiquidDetailCard } from '../LiquidDetailCard'

jest.mock('../LiquidDetailCard')

const mockLiquidDetailCard = LiquidDetailCard as jest.MockedFunction<
  typeof LiquidDetailCard
>

const render = (
  props: React.ComponentProps<typeof LiquidsLabwareDetailsModal>
) => {
  return renderWithProviders(<LiquidsLabwareDetailsModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('LiquidsLabwareDetailsModal', () => {
  beforeEach(() => {
    mockLiquidDetailCard.mockReturnValue(<>mock LiquidDetailCard</>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render LiquidDetailCard', () => {
    const [{ getByText }] = render({ liquidId: '0', closeModal: jest.fn() })
    getByText(nestedTextMatcher('mock LiquidDetailCard'))
  })
})
