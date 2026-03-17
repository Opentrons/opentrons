import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { Devices } from '..'

import type { ComponentProps } from 'react'

const mockFunc = vi.fn()

const render = (props: ComponentProps<typeof Devices>) => {
  return renderWithProviders(<Devices {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Devices', () => {
  let props: ComponentProps<typeof Devices>

  beforeEach(() => {
    props = {
      robotName: 'mockRobot',
      setCurrentOption: mockFunc,
    }
  })

  it('should render the devices table', () => {
    render(props)
    screen.getByText('Device')
    screen.getByText('Location')
    screen.getByText('Location')
    screen.getByText('External keyboard')
    screen.getByText('USB-1')
    screen.getByText('USB drive')
    screen.getByText('USB-2')
    screen.getByText('Rear panel')
    screen.getByText('INTERNAL')
  })
})
