import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

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

  it('should display the vacuum dock as A4', () => {
    props.slotId = VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA
    render(props)
    screen.getByText('A4')
    expect(
      screen.queryByText(VACUUM_MODULE_DOCK_A4_ADDRESSABLE_AREA)
    ).not.toBeInTheDocument()
  })
})
