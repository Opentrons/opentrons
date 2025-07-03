import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { FeatureFlag } from '../FeatureFlag'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof FeatureFlag>) => {
  return renderWithProviders(<FeatureFlag {...props} />, {
    i18nInstance: i18n,
  })
}

describe('FeatureFlag', () => {
  let props: ComponentProps<typeof FeatureFlag>

  beforeEach(() => {
    props = {
      enablePDProtocolGeneration: true,
      onTogglePDProtocolGeneration: vi.fn(),
    }
  })

  it('renders the feature flags section', () => {
    render(props)
    screen.getByText('Feature Flags')
    screen.getByText('Protocol Designer Protocol Generation')
    screen.getByText('Enable Protocol Designer protocol generation features')
    screen.getByRole('switch')
  })

  it('should call onTogglePDProtocolGeneration when clicking toggle switch when enabled', () => {
    render(props)
    fireEvent.click(screen.getByRole('switch'))
    expect(props.onTogglePDProtocolGeneration).toHaveBeenCalled()
  })

  it('should call onTogglePDProtocolGeneration when clicking toggle switch when disabled', () => {
    props.enablePDProtocolGeneration = false
    render(props)
    fireEvent.click(screen.getByRole('switch'))
    expect(props.onTogglePDProtocolGeneration).toHaveBeenCalled()
  })
})
