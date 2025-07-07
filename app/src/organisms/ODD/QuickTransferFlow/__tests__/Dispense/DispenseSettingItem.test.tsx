import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { DispenseSettingItem } from '../../Dispense/DispenseSettingItem'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof DispenseSettingItem>) => {
  return renderWithProviders(<DispenseSettingItem {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DispenseSettingItem', () => {
  let props: ComponentProps<typeof DispenseSettingItem>
  beforeEach(() => {
    props = {
      displayItem: {
        option: 'dispense_flow_rate',
        copy: 'Dispense flow rate',
        value: '35 µL/s',
        enabled: true,
        onClick: vi.fn(),
      },
    }
  })
  it('renders the correct item - flow rate', () => {
    render(props)
    screen.getByText('Dispense flow rate')
    screen.getByText('35 µL/s')
  })

  it('renders the correct item - tip position', () => {
    props.displayItem = {
      option: 'dispense_tip_position',
      copy: 'Tip position',
      value: '1 mm from bottom',
      enabled: true,
      onClick: vi.fn(),
    }
    render(props)
    screen.getByText('Tip position')
    screen.getByText('1 mm from bottom')
  })

  it('renders the correct item - submerge', () => {
    props.displayItem = {
      option: 'dispense_submerge',
      copy: 'Submerge',
      value: '',
      enabled: false,
      onClick: vi.fn(),
    }
    render(props)
    screen.getByText('Submerge')
  })

  it('renders the correct item - pre-wet tip', () => {
    props.displayItem = {
      option: 'pre_wet_tip',
      copy: 'Pre-wet tip',
      value: 'Enabled',
      enabled: true,
      onClick: vi.fn(),
    }
    render(props)
    screen.getByText('Pre-wet tip')
  })

  it('renders the correct item - mix', () => {
    props.displayItem = {
      option: 'dispense_mix',
      copy: 'Mix',
      value: '50 µL, 3 reps',
      enabled: true,
      onClick: vi.fn(),
    }
    render(props)
    screen.getByText('Mix')
  })

  it('renders the correct item - delay', () => {
    props.displayItem = {
      option: 'dispense_delay',
      copy: 'Delay',
      value: '1.0 s',
      enabled: true,
      onClick: vi.fn(),
    }
    render(props)
    screen.getByText('Delay')
  })

  it('renders the correct item - retract', () => {
    props.displayItem = {
      option: 'dispense_retract',
      copy: 'Retract',
      value: '',
      enabled: false,
      onClick: vi.fn(),
    }
    render(props)
    screen.getByText('Retract')
  })

  it('renders the correct item - touch tip', () => {
    props.displayItem = {
      option: 'dispense_touch_tip',
      copy: 'Touch tip',
      value: '2 mm from bottom',
      enabled: true,
      onClick: vi.fn(),
    }
    render(props)
    screen.getByText('Touch tip')
  })

  it('renders the correct item - air gap', () => {
    props.displayItem = {
      option: 'dispense_air_gap',
      copy: 'Air gap',
      value: '5 µL',
      enabled: true,
      onClick: vi.fn(),
    }
    render(props)
    screen.getByText('Air gap')
  })
})
