import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { PipetteSelect } from '../../../molecules/PipetteSelect'
import { PipetteSelection } from '../PipetteSelection'

jest.mock('../../../molecules/PipetteSelect')

const mockPipetteSelect = PipetteSelect as jest.MockedFunction<
  typeof PipetteSelect
>
const render = (props: React.ComponentProps<typeof PipetteSelection>) => {
  return renderWithProviders(<PipetteSelection {...props} />, {
    i18nInstance: i18n,
  })[0]
}
describe('PipetteSelection', () => {
  let props: React.ComponentProps<typeof PipetteSelection>
  beforeEach(() => {
    props = {
      pipetteName: null,
      onPipetteChange: jest.fn(),
    }
    mockPipetteSelect.mockReturnValue(<div>mock pipette select</div>)
  })
  it('renders the text for pipette selection', () => {
    const { getByText } = render(props)
    getByText('Choose a pipette to attach')
    getByText('mock pipette select')
  })
})
