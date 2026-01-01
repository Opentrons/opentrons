import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../testing/utils'
import { RobotInfoLabel } from '../index'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof RobotInfoLabel>) => {
  return renderWithProviders(<RobotInfoLabel {...props} />)
}

describe('RobotInfoLabel', () => {
  let props: ComponentProps<typeof RobotInfoLabel>

  beforeEach(() => {
    props = {
      deckLabel: 'A1',
    }
  })

  it('should render the proper styles - web style', () => {
    render(props)
    const robotInfoLabel = screen.getByTestId('RobotInfoLabel_A1')
    expect(robotInfoLabel.className).toContain('label')
    expect(robotInfoLabel.className).toContain('robot_info_label_no_highlight')
    expect(robotInfoLabel.className).toContain('default')
  })

  it.todo('should render the proper styles - odd style')

  it('should render robot info label', () => {
    render(props)
    screen.getByText('A1')
  })

  it('should render an icon', () => {
    props = {
      iconName: 'ot-temperature-v2',
    }
    render(props)
    screen.getByLabelText('ot-temperature-v2')
  })

  it('should render an icon large', () => {
    props = {
      iconName: 'ot-temperature-v2',
      size: 'large',
    }
    render(props)
    const robotInfoLabelIcon = screen.getByLabelText('ot-temperature-v2')
    expect(robotInfoLabelIcon).toHaveStyle('height: 1.5rem')
  })
})
