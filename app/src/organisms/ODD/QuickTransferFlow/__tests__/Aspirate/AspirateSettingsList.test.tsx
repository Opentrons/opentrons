import { describe, it, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { AspirateSettingsList } from '../../Aspirate/AspirateSettingsList'
import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof AspirateSettingsList>) => {
  return renderWithProviders(<AspirateSettingsList {...props} />, {
    i18nInstance: i18n,
  })
}

const mockClick = vi.fn()

describe('AspirateSettingsList', () => {
  let props: ComponentProps<typeof AspirateSettingsList>
  beforeEach(() => {
    props = {
      items: [
        {
          option: 'aspirate_flow_rate',
          copy: 'Aspirate flow rate',
          value: '35 µL/s',
          enabled: true,
          onClick: mockClick,
        },
        {
          option: 'aspirate_tip_position',
          copy: 'Tip position',
          value: '1 mm from bottom',
          enabled: true,
          onClick: mockClick,
        },
        {
          option: 'aspirate_submerge',
          copy: 'Submerge',
          value: '',
          enabled: false,
          onClick: mockClick,
        },
        {
          option: 'pre_wet_tip',
          copy: 'Pre-wet tip',
          value: 'Enabled',
          enabled: true,
          onClick: mockClick,
        },
        {
          option: 'aspirate_mix',
          copy: 'Mix',
          value: '50 µL, 3 reps',
          enabled: true,
          onClick: mockClick,
        },
        {
          option: 'aspirate_delay',
          copy: 'Delay',
          value: '1.0 s',
          enabled: true,
          onClick: mockClick,
        },
        {
          option: 'aspirate_retract',
          copy: 'Retract',
          value: '',
          enabled: false,
          onClick: mockClick,
        },
        {
          option: 'aspirate_touch_tip',
          copy: 'Touch tip',
          value: '2 mm from bottom',
          enabled: true,
          onClick: mockClick,
        },
        {
          option: 'aspirate_air_gap',
          copy: 'Air gap',
          value: '5 µL',
          enabled: true,
          onClick: mockClick,
        },
      ],
    } as any
  })
  it('renders the correct items', () => {
    render(props)
    props.items.forEach(item => {
      screen.getByText(item.copy)
      if (item.value) {
        screen.getByText(item.value)
      }
    })
  })
})
