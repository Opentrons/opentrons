import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { WellOrderModal } from '..'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof WellOrderModal>) => {
  return renderWithProviders(<WellOrderModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('WellOrderModal', () => {
  let props: ComponentProps<typeof WellOrderModal>

  beforeEach(() => {
    props = {
      isOpen: true,
      closeModal: vi.fn(),
      prefix: 'aspirate',
      firstName: 'aspirate_wellOrder_l',
      secondName: 'aspirate_wellOrder_r',
      firstValue: null,
      secondValue: null,
      updateValues: vi.fn(),
    }
  })

  it('renders all the text and buttons for the modal with the default fields', async () => {
    const user = userEvent.setup()
    render(props)
    screen.getByText('Edit well order')
    screen.getByText('Change how the robot moves from well to well.')
    screen.getByText('Primary order')
    screen.getByText('then')
    screen.getByText('Secondary order')
    await user.click(screen.getByText('Reset to default'))
    expect(props.closeModal).toHaveBeenCalled()
    expect(props.updateValues).toHaveBeenCalled()
    await user.click(screen.getByText('Cancel'))
    expect(props.closeModal).toHaveBeenCalled()
    await user.click(screen.getByText('Save'))
    expect(props.closeModal).toHaveBeenCalled()
    expect(props.updateValues).toHaveBeenCalled()
  })
})
