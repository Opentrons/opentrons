import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'

import { ExportButton } from '..'

import type { ComponentProps } from 'react'

const mockOnClick = vi.fn()

const render = (props: ComponentProps<typeof ExportButton>) => {
  return renderWithProviders(<ExportButton {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ExportButton', () => {
  let props: ComponentProps<typeof ExportButton>

  beforeEach(() => {
    props = {
      onClick: mockOnClick,
    }
  })
  it('should render icon and text', () => {
    render(props)
    screen.getByTestId('export-icon')
    screen.getByText('Export')
  })

  it('should call a mock function when clicking', () => {
    render(props)
    fireEvent.click(screen.getByText('Export'))
    expect(mockOnClick).toHaveBeenCalled()
  })
})
