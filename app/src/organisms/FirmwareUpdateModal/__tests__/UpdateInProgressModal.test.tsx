import * as React from 'react'
import { describe, it, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { UpdateInProgressModal } from '../UpdateInProgressModal'

const render = (props: React.ComponentProps<typeof UpdateInProgressModal>) => {
  return renderWithProviders(<UpdateInProgressModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('UpdateInProgressModal', () => {
  let props: React.ComponentProps<typeof UpdateInProgressModal>
  beforeEach(() => {
    props = {
      subsystem: 'pipette_right',
    }
  })
  it('renders pipette text', () => {
    const { getByText } = render(props)
    getByText('Updating pipette firmware...')
  })
  it('renders Hepa/UV text', () => {
    props = {
      subsystem: 'hepa_uv',
    }
    const { getByText } = render(props)
    getByText('Updating HEPA/UV Module firmware...')
  })
})
