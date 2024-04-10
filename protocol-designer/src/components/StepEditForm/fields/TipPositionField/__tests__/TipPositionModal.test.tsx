import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../localization'
import { TipPositionModal } from '../TipPositionModal'
import { TipPositionAllViz } from '../TipPositionAllViz'

vi.mock('../TipPositionAllViz')
const render = (props: React.ComponentProps<typeof TipPositionModal>) => {
  return renderWithProviders(<TipPositionModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockUpdateZSpec = vi.fn()
const mockUpdateXSpec = vi.fn()
const mockUpdateYSpec = vi.fn()

describe('TipPositionModal', () => {
  let props: React.ComponentProps<typeof TipPositionModal>

  beforeEach(() => {
    props = {
      closeModal: vi.fn(),
      wellDepthMm: 50,
      wellXWidthMm: 10.3,
      wellYWidthMm: 10.5,
      isIndeterminate: false,
      specs: {
        z: {
          name: 'aspirate_mmFromBottom',
          value: null,
          updateValue: mockUpdateZSpec,
        },
        y: {
          name: 'aspirate_y_position',
          value: 0,
          updateValue: mockUpdateXSpec,
        },
        x: {
          name: 'aspirate_x_position',
          value: 0,
          updateValue: mockUpdateYSpec,
        },
      },
    }
    vi.mocked(TipPositionAllViz).mockReturnValue(<div>mock TipPositionViz</div>)
  })
  it('renders the modal text and radio button text', () => {
    render(props)
    screen.getByText('Tip Positioning')
    screen.getByText('Change from where in the well the robot aspirates')
    screen.getByRole('radio', { name: '1 mm from the bottom center (default)' })
    screen.getByRole('radio', { name: 'Custom' })
    fireEvent.click(screen.getByText('cancel'))
    expect(props.closeModal).toHaveBeenCalled()
    fireEvent.click(screen.getByText('done'))
    expect(props.closeModal).toHaveBeenCalled()
    expect(mockUpdateXSpec).toHaveBeenCalled()
    expect(mockUpdateYSpec).toHaveBeenCalled()
    expect(mockUpdateZSpec).toHaveBeenCalled()
  })
  it('renders the alert if the x/y position values are too close to the max/min for x value', () => {
    props.specs.x.value = 9.7
    render(props)
    screen.getByText('warning')
    screen.getByText(
      'The X and/or Y position value is close to edge of the well and might collide with it'
    )
  })
  it('renders the alert if the x/y position values are too close to the max/min for y value', () => {
    props.specs.y.value = -9.7
    render(props)
    screen.getByText('warning')
    screen.getByText(
      'The X and/or Y position value is close to edge of the well and might collide with it'
    )
  })
  it('renders the custom options, captions, and visual', () => {
    render(props)
    fireEvent.click(screen.getByRole('radio', { name: 'Custom' }))
    expect(screen.getAllByRole('textbox', { name: '' })).toHaveLength(3)
    screen.getByText('X position')
    screen.getByText('between -5.1 and 5.2')
    screen.getByText('Y position')
    screen.getByText('between -5.2 and 5.3')
    screen.getByText('Z position')
    screen.getByText('between 0 and 100')
    screen.getByText('mock TipPositionViz')
  })
  it('renders a custom input field and clicks on it, calling the mock updates', () => {
    render(props)
    fireEvent.click(screen.getByRole('radio', { name: 'Custom' }))
    const xInputField = screen.getAllByRole('textbox', { name: '' })[0]
    fireEvent.change(xInputField, { target: { value: 3 } })
    const yInputField = screen.getAllByRole('textbox', { name: '' })[1]
    fireEvent.change(yInputField, { target: { value: -2 } })
    const zInputField = screen.getAllByRole('textbox', { name: '' })[2]
    fireEvent.change(zInputField, { target: { value: 10 } })
    fireEvent.click(screen.getByText('done'))
    expect(props.closeModal).toHaveBeenCalled()
    expect(mockUpdateXSpec).toHaveBeenCalled()
    expect(mockUpdateYSpec).toHaveBeenCalled()
    expect(mockUpdateZSpec).toHaveBeenCalled()
  })
  it('renders custom input fields and displays error texts', () => {
    props = {
      ...props,
      specs: {
        z: {
          name: 'aspirate_mmFromBottom',
          value: 101,
          updateValue: mockUpdateZSpec,
        },
        y: {
          name: 'aspirate_y_position',
          value: -500,
          updateValue: mockUpdateXSpec,
        },
        x: {
          name: 'aspirate_x_position',
          value: 10.7,
          updateValue: mockUpdateYSpec,
        },
      },
    }
    render(props)
    fireEvent.click(screen.getByText('done'))
    //  display out of bounds error
    screen.getByText('accepted range is 0 to 100')
    screen.getByText('accepted range is -5.2 to 5.3')
    screen.getByText('accepted range is -5.1 to 5.2')
    const xInputField = screen.getAllByRole('textbox', { name: '' })[0]
    fireEvent.change(xInputField, { target: { value: 3.55555 } })
    fireEvent.click(screen.getByText('done'))
    //   display too many decimals error
    screen.getByText('a max of 1 decimal place is allowed')
  })
})
