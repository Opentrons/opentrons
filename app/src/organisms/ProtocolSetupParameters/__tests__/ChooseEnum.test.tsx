import * as React from 'react'
import { it, describe, beforeEach, vi, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { COLORS } from '@opentrons/components'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ChooseEnum } from '../ChooseEnum'

vi.mocked('../../ToasterOven')
const render = (props: React.ComponentProps<typeof ChooseEnum>) => {
  return renderWithProviders(<ChooseEnum {...props} />, {
    i18nInstance: i18n,
  })
}
describe('ChooseEnum', () => {
  let props: React.ComponentProps<typeof ChooseEnum>

  beforeEach(() => {
    props = {
      handleGoBack: vi.fn(),
      parameter: {
        displayName: 'Dry Run',
        variableName: 'dry_run',
        description: 'a dry run description',
        type: 'boolean',
        default: false,
        value: false,
      },
      setParameter: vi.fn(),
      rawValue: false,
    }
  })

  it('should render the text and buttons work for a boolean param', () => {
    render(props)
    screen.getByText('Choose Dry Run')
    const btn = screen.getByRole('button', { name: 'Restore default values' })
    screen.getByText('On')
    screen.getByText('Off')
    const trueOption = screen.getByRole('label', { name: 'On' })
    const falseOption = screen.getByRole('label', { name: 'Off' })
    expect(falseOption).toHaveStyle(`background-color: ${COLORS.blue60}`)
    expect(trueOption).toHaveStyle(`background-color: ${COLORS.blue40}`)
    fireEvent.click(btn)
    expect(props.setParameter).toHaveBeenCalled()
  })
  it('renders the back icon and calls the prop', () => {
    render(props)
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(props.handleGoBack).toHaveBeenCalled()
  })
  it('should render the text and buttons for choice param', () => {
    props = {
      ...props,
      parameter: {
        displayName: 'Default Module Offsets',
        variableName: 'DEFAULT_OFFSETS',
        value: 'none',
        description: '',
        type: 'str',
        choices: [
          {
            displayName: 'no offsets',
            value: 'none',
          },
          {
            displayName: 'temp offset',
            value: '1',
          },
          {
            displayName: 'heater-shaker offset',
            value: '2',
          },
        ],
        default: 'none',
      },
      rawValue: '1',
    }
    render(props)
    screen.getByText('no offsets')
    screen.getByText('temp offset')
    screen.getByText('heater-shaker offset')
    const notSelectedOption = screen.getByRole('label', { name: 'no offsets' })
    const selectedOption = screen.getByRole('label', {
      name: 'temp offset',
    })
    expect(notSelectedOption).toHaveStyle(`background-color: ${COLORS.blue40}`)
    expect(selectedOption).toHaveStyle(`background-color: ${COLORS.blue60}`)
  })
})
