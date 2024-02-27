import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ProgressBar } from '../../../atoms/ProgressBar'
import { UpdateInProgressModal } from '../UpdateInProgressModal'

vi.mock('../../../atoms/ProgressBar')

const render = (props: React.ComponentProps<typeof UpdateInProgressModal>) => {
  return renderWithProviders(<UpdateInProgressModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('UpdateInProgressModal', () => {
  let props: React.ComponentProps<typeof UpdateInProgressModal>
  beforeEach(() => {
    props = {
      percentComplete: 12,
      subsystem: 'pipette_right',
    }
    vi.mocked(ProgressBar).mockReturnValue('12' as any)
  })
  it('renders test and progress bar', () => {
    render(props)
    screen.getByText('Updating pipette firmware...')
    screen.getByText('12')
  })
})
