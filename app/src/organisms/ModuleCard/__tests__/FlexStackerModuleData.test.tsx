import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { StatusLabel } from '/app/atoms/StatusLabel'
import { FlexStackerModuleData } from '../FlexStackerModuleData'

import type { ComponentProps } from 'react'
import type { FlexStackerModule } from '/app/redux/modules/types'

vi.mock('/app/atoms/StatusLabel')

const render = (props: ComponentProps<typeof FlexStackerModuleData>) => {
  return renderWithProviders(<FlexStackerModuleData {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('FlexStackerModuleData', () => {
  let props: ComponentProps<typeof FlexStackerModuleData>

  beforeEach(() => {
    props = {
      moduleData: {
        platformState: 'extended',
        hopperDoorState: 'closed',
      } as FlexStackerModule['data'],
    }
    vi.mocked(StatusLabel).mockReturnValue(<div>Mock StatusLabel</div>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders both door and shuttle statuses', () => {
    render(props)
    expect(screen.getAllByText('Mock StatusLabel')).toHaveLength(2)
  })

  it('applies correct styles for door when opened', () => {
    props.moduleData.hopperDoorState = 'opened'
    render(props)
    const statusLabels = screen.getAllByText('Mock StatusLabel')
    expect(statusLabels[0]).toHaveStyle('backgroundColor: COLORS.blue30')
  })

  it('applies correct styles for door when closed', () => {
    props.moduleData.hopperDoorState = 'closed'
    render(props)
    const statusLabels = screen.getAllByText('Mock StatusLabel')
    expect(statusLabels[0]).toHaveStyle('backgroundColor: COLORS.grey30')
  })

  it('applies correct styles for shuttle when extended', () => {
    props.moduleData.platformState = 'extended'
    render(props)
    // Find all instances of Mock StatusLabel
    const statusLabels = screen.getAllByText('Mock StatusLabel')
    // Second status label should be for shuttle status
    expect(statusLabels[1]).toHaveStyle('backgroundColor: COLORS.blue30')
  })

  it('applies correct styles for shuttle when retracted', () => {
    props.moduleData.platformState = 'retracted'
    render(props)
    const statusLabels = screen.getAllByText('Mock StatusLabel')
    expect(statusLabels[1]).toHaveStyle('backgroundColor: COLORS.blue30')
  })

  it('applies correct styles for shuttle when missing', () => {
    props.moduleData.platformState = 'missing'
    render(props)
    const statusLabels = screen.getAllByText('Mock StatusLabel')
    expect(statusLabels[1]).toHaveStyle('backgroundColor: COLORS.red30')
  })
})
