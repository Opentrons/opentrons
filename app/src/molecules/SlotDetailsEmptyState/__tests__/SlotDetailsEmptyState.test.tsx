import { it, describe, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { i18n } from '/app/i18n'
import { renderWithProviders } from '/app/__testing-utils__'
import { SlotDetailsEmptyState } from '..'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof SlotDetailsEmptyState>) => {
  return renderWithProviders(<SlotDetailsEmptyState {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SlotDetailsEmptyState', () => {
    let props: ComponentProps<typeof SlotDetailsEmptyState>

    beforeEach(() => {
        props = {
            slotId: 'A1',
        }
    })

    it('should render slot empty state', () => {
        render(props)
        screen.getByText('A1')
        screen.getByText('Slot empty')
    })
})