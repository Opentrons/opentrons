import * as React from 'react'
import { StaticRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { mockLabwareDef } from '../../../../LabwarePositionCheck/__fixtures__/mockLabwareDef'
import { LabwareListItem } from '../LabwareListItem'
import { OffDeckLabwareList } from '../OffDeckLabwareList'

jest.mock('../LabwareListItem')

const mockLabwareListItem = LabwareListItem as jest.MockedFunction<
  typeof LabwareListItem
>

const render = (props: React.ComponentProps<typeof OffDeckLabwareList>) => {
  return renderWithProviders(
    <StaticRouter>
      <OffDeckLabwareList {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('OffDeckLabwareList', () => {
  beforeEach(() => {
    mockLabwareListItem.mockReturnValue(<div>mock labware list item</div>)
  })
  it('renders null if labware items is null', () => {
    const { container } = render({
      labwareItems: [],
      isOt3: false,
    })
    expect(container.firstChild).toBeNull()
  })
  it('renders additional offdeck labware info if there is an offdeck labware', () => {
    const { getByText } = render({
      labwareItems: [
        {
          nickName: 'nickName',
          definition: mockLabwareDef,
          initialLocation: 'offDeck',
          moduleModel: null,
          moduleLocation: null,
        },
      ],
      isOt3: false,
    })
    getByText('Additional Off-Deck Labware')
    getByText('mock labware list item')
  })
})
