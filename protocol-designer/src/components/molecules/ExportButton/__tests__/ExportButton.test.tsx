import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ExportButton } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'

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
