import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { StatusLabel } from '/app/atoms/StatusLabel'
import { i18n } from '/app/i18n'
import { mockMagneticModule } from '/app/redux/modules/__fixtures__'

import { MagneticModuleData } from '../MagneticModuleData'

import type { ComponentProps } from 'react'

vi.mock('/app/atoms/StatusLabel')

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
    vi.mocked(StatusLabel).mockReturnValue(<div>Mock StatusLabel</div>)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders a status', () => {
    render(props)

    screen.getByText('Mock StatusLabel')
  })

  it('renders magnet height data', () => {
    render(props)

    screen.getByText(`Height: ${props.moduleHeight}`)
  })
})
