import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { LabwareNotCompatibleModal } from '..'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof LabwareNotCompatibleModal>) => {
  return renderWithProviders(<LabwareNotCompatibleModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LabwareNotCompatibleModal', () => {
  let props: ComponentProps<typeof LabwareNotCompatibleModal>
  it('renders the text and buttons work as expected for clear', () => {
    props = {
      onClose: vi.fn(),
      onDone: vi.fn(),
      labwareDisplayName: 'mock displayName',
    }
    render(props)
    screen.getByText(
      'This adapter is required for the mock displayName currently on the slot. If you remove the adapter, the mock displayName will be deleted too.'
    )
    fireEvent.click(screen.getByText('Cancel'))
    expect(props.onClose).toHaveBeenCalled()
    fireEvent.click(screen.getAllByText('Delete labware')[1])
    expect(props.onDone).toHaveBeenCalled()
  })
})
