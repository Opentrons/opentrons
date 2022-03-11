import * as React from 'react'
import { i18n } from '../../../../i18n'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { TestShakeSlideout } from '../TestShakeSlideout'
import { HeaterShakerModuleCard } from '../../HeaterShakerWizard/HeaterShakerModuleCard'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'

jest.mock('../../HeaterShakerWizard/HeaterShakerModuleCard')

const mockHeaterShakerModuleCard = HeaterShakerModuleCard as jest.MockedFunction<
  typeof HeaterShakerModuleCard
>

const render = (props: React.ComponentProps<typeof TestShakeSlideout>) => {
  return renderWithProviders(<TestShakeSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TestShakeSlideout', () => {
  let props: React.ComponentProps<typeof TestShakeSlideout>
  beforeEach(() => {
    props = {
      module: mockHeaterShaker,
      onCloseClick: jest.fn(),
      isExpanded: true,
    }
    mockHeaterShakerModuleCard.mockReturnValue(
      <div>Mock Heater Shaker Module Card</div>
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the slideout information banner icon and description', () => {
    const { getByText, getByLabelText } = render(props)
    getByLabelText('information')
    getByText(
      'If you want to add labware to the module before doing a test shake, you can use the labware latch controls to hold the latches open.'
    )
  })

  it('renders module controls and a heater shaker module card', () => {
    const { getByText } = render(props)

    getByText('Module Controls')
    getByText('Mock Heater Shaker Module Card')
  })

  it('renders the labware latch open button', () => {
    const { getByRole, getByText } = render(props)
    getByText('Labware Latch')
    const button = getByRole('button', { name: /Open/i })
    expect(button).toBeEnabled()
  })

  it('renders an input field and start button for speed setting', () => {
    const { getByText, getByRole } = render(props)

    getByText('Shake speed')
    getByRole('textbox')

    const button = getByRole('button', { name: /Start/i })
    expect(button).toBeEnabled()
  })

  it('renders a troubleshoot accordion and contents when it is clicked', () => {
    const { getByText } = render(props)

    const troubleshooting = getByText('Troubleshooting')
    fireEvent.click(troubleshooting)

    getByText(
      'Revisit instructions for attaching the module to the deck as well as attaching the thermal adapter.'
    )
    getByText('Go to attachment instructions')
  })
})
