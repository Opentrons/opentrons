import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { AspirateSettingItem } from '../../Aspirate/AspirateSettingItem'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof AspirateSettingItem>) => {
  return renderWithProviders(<AspirateSettingItem {...props} />, {
    i18nInstance: i18n,
  })
}

const mockClick = vi.fn()

describe('AspirateSettingItem', () => {
  let props: ComponentProps<typeof AspirateSettingItem>
  beforeEach(() => {
    props = {
      displayItem: {
        option: 'aspirate_flow_rate',
        copy: 'Aspirate flow rate',
        value: '35 µL/s',
        enabled: true,
        onClick: mockClick,
      },
    }
  })
  it('renders the correct item - flow rate', () => {
    render(props)
    screen.getByText('Aspirate flow rate')
    screen.getByText('35 µL/s')
  })

  it('renders the correct item - tip position', () => {
    props.displayItem = {
      option: 'aspirate_tip_position',
      copy: 'Tip position',
      value: '1 mm from bottom',
      enabled: true,
      onClick: mockClick,
    }
    render(props)
    screen.getByText('Tip position')
    screen.getByText('1 mm from bottom')
  })

  it('renders the correct item - submerge', () => {
    props.displayItem = {
      option: 'aspirate_submerge',
      copy: 'Submerge',
      value: '',
      enabled: false,
      onClick: mockClick,
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
      onClick: mockClick,
    }
    render(props)
    screen.getByText('Pre-wet tip')
  })

  it('renders the correct item - mix', () => {
    props.displayItem = {
      option: 'aspirate_mix',
      copy: 'Mix',
      value: '50 µL, 3 reps',
      enabled: true,
      onClick: mockClick,
    }
    render(props)
    screen.getByText('Mix')
  })

  it('renders the correct item - delay', () => {
    props.displayItem = {
      option: 'aspirate_delay',
      copy: 'Delay',
      value: '1.0 s',
      enabled: true,
      onClick: mockClick,
    }
    render(props)
    screen.getByText('Delay')
  })

  it('renders the correct item - retract', () => {
    props.displayItem = {
      option: 'aspirate_retract',
      copy: 'Retract',
      value: '',
      enabled: false,
      onClick: mockClick,
    }
    render(props)
    screen.getByText('Retract')
  })

  it('renders the correct item - touch tip', () => {
    props.displayItem = {
      option: 'aspirate_touch_tip',
      copy: 'Touch tip',
      value: '2 mm from bottom',
      enabled: true,
      onClick: mockClick,
    }
    render(props)
    screen.getByText('Touch tip')
  })

  it('renders the correct item - air gap', () => {
    props.displayItem = {
      option: 'aspirate_air_gap',
      copy: 'Air gap',
      value: '5 µL',
      enabled: true,
      onClick: mockClick,
    }
    render(props)
    screen.getByText('Air gap')
  })
})
