import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ExportButton } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof ExportButton>) => {
  return renderWithProviders(<ExportButton {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ExportButton', () => {
  let props: ComponentProps<typeof ExportButton>

  beforeEach(() => {
    props = {
      setShowExportWarningModal: vi.fn(),
    }
  })
  it('should render icon and text', () => {
    render(props)
    screen.getByTestId('water-drop') // ToDo (kk 05/09/2025): icon will be replaced with the right one
    screen.getByText('Export')
  })

  it('should call a mock function when clicking', () => {
    render(props)
    fireEvent.click(screen.getByText('Export'))
    expect(props.setShowExportWarningModal).toHaveBeenCalled()
  })
})
