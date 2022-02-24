import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { TestShake } from '../TestShake'
import { HeaterShakerModuleCard } from '../HeaterShakerModuleCard'
import { fireEvent } from '@testing-library/react'

jest.mock('../HeaterShakerModuleCard')

const mockHeaterShakerModuleCard = HeaterShakerModuleCard as jest.MockedFunction<
  typeof HeaterShakerModuleCard
>

const render = (props: React.ComponentProps<typeof TestShake>) => {
  return renderWithProviders(<TestShake {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TestShake', () => {
  let props: React.ComponentProps<typeof TestShake>
  beforeEach(() => {
    props = {
      setCurrentPage: jest.fn(),
    }
    mockHeaterShakerModuleCard.mockReturnValue(
      <div>Mock Heater Shaker Module Card</div>
    )
  })
  it('renders the correct title', () => {
    const { getByText } = render(props)
    getByText('Step 4 of 4: Test shake')
  })

  it('renders the information banner icon and description', () => {
    const { getByText, getByLabelText } = render(props)
    getByLabelText('information')
    getByText(
      'If you want to add labware to the module before doing a test shake, you can use the labware latch controls to hold the latches open.'
    )
  })

  it('renders a heater shaker module card', () => {
    const { getByText } = render(props)

    getByText('Mock Heater Shaker Module Card')
  })

  it('renders the open labware latch button and is enabled', () => {
    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Open Labware Latch/i })
    expect(button).toBeEnabled()
  })

  it('renders the start shaking button and is enabled', () => {
    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Start Shaking/i })
    expect(button).toBeEnabled()
  })

  it('renders an input field for speed setting', () => {
    const { getByText, getByRole } = render(props)

    getByText('Set shake speed')
    getByRole('textbox')
  })

  it('renders troubleshooting accordion and contents', () => {
    const { getByText, getByRole } = render(props)

    const troubleshooting = getByText('Troubleshooting')
    fireEvent.click(troubleshooting)

    getByText(
      'Return to Step 1 to see instructions for securing the module to the deck.'
    )
    const buttonStep1 = getByRole('button', { name: /Go to Step 1/i })
    expect(buttonStep1).toBeEnabled()

    getByText(
      'Return to Step 2 to see instructions for securing the thermal adapter to the module.'
    )
    const buttonStep2 = getByRole('button', { name: /Go to Step 2/i })
    expect(buttonStep2).toBeEnabled()
  })
})
