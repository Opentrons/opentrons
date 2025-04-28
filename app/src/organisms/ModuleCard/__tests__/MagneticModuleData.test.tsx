import { screen } from '@testing-library/react'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { mockMagneticModule } from '/app/redux/modules/__fixtures__'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MagneticModuleData } from '../MagneticModuleData'

const render = (props: ComponentProps<typeof MagneticModuleData>) => {
  return renderWithProviders(<MagneticModuleData {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('MagneticModuleData', () => {
  let props: ComponentProps<typeof MagneticModuleData>
  beforeEach(() => {
    props = {
      moduleHeight: mockMagneticModule.data.height,
      moduleModel: mockMagneticModule.moduleModel,
      moduleStatus: mockMagneticModule.data.status,
    }
  })

  it('renders a status', () => {
    render(props)
    screen.getByTestId('mag_module_data')

    const chip = screen.getByTestId('mag_module_chip')
    expect(chip).toHaveTextContent(`${props.moduleStatus}`)
  })

  it('renders magnet height data', () => {
    render(props)

    screen.getByText(`Height: ${props.moduleHeight}`)
  })
})
