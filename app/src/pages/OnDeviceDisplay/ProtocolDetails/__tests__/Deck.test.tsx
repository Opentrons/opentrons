import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { DeckThumbnail } from '../../../../molecules/DeckThumbnail'
import { Deck } from '../Deck'

jest.mock('../../../../molecules/DeckThumbnail')

const mockDeckThumbnail = DeckThumbnail as jest.MockedFunction<
  typeof DeckThumbnail
>

const MOCK_PROTOCOL_ID = 'mock_protocol_id'

const render = (props: React.ComponentProps<typeof Deck>) => {
  return renderWithProviders(<Deck {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Hardware', () => {
  let props: React.ComponentProps<typeof Deck>
  beforeEach(() => {
    props = {
      protocolId: MOCK_PROTOCOL_ID,
    }
    mockDeckThumbnail.mockReturnValue(<div>mock Deck Thumbnail</div>)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders deck view section', () => {
    const { getByText } = render(props)[0]
    expect(getByText('mock Deck Thumbnail')).toBeInTheDocument()
  })
})
