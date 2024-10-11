import type * as React from 'react'
import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { StatusLabel } from '/app/atoms/StatusLabel'
import { MagneticModuleData } from '../MagneticModuleData'
import { mockMagneticModule } from '/app/redux/modules/__fixtures__'

vi.mock('/app/atoms/StatusLabel')

const render = (props: React.ComponentProps<typeof MagneticModuleData>) => {
  return renderWithProviders(<MagneticModuleData {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('MagneticModuleData', () => {
  let props: React.ComponentProps<typeof MagneticModuleData>
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
