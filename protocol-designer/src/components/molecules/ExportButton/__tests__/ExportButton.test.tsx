import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ExportButton } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { savePythonProtocolFile } from '../../../../load-file/actions'

vi.mock('../../../../load-file/actions')

const render = () => {
  return renderWithProviders(<ExportButton />, {
    i18nInstance: i18n,
  })
}

describe('LiquidButton', () => {
  it('should render icon and text', () => {
    render()
    screen.getByTestId('water-drop') // ToDo (kk 05/09/2025): icon will be replaced with the right one
    screen.getByText('Export')
  })

  it('should call a mock function when clicking', () => {
    render()
    fireEvent.click(screen.getByText('Export'))
    expect(savePythonProtocolFile).toHaveBeenCalled()
  })
})
