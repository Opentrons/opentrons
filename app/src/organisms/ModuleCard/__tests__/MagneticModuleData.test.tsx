import * as React from 'react'
import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { StatusLabel } from '../../../atoms/StatusLabel'
import { MagneticModuleData } from '../MagneticModuleData'
import { mockMagneticModule } from '../../../redux/modules/__fixtures__'

vi.mock('../../../atoms/StatusLabel')

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
