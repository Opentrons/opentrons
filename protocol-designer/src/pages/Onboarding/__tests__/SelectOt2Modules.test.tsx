import { describe, it, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import { screen } from '@testing-library/react'
import { i18n } from '../../../assets/localization'
import { renderWithProviders } from '../../../__testing-utils__'
import { SelectOt2Modules } from '../SelectOt2Modules'

import type { ComponentProps } from 'react'
import type { WizardFormState, WizardTileProps } from '../types'

vi.mock('../../../feature-flags/selectors')

const render = (props: ComponentProps<typeof SelectOt2Modules>) => {
  return renderWithProviders(<SelectOt2Modules {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const values = {
  fields: {
    name: '',
    description: '',
    organizationOrAuthor: '',
    robotType: OT2_ROBOT_TYPE,
  },
  additionalEquipment: ['trashBin'],
  modules: {},
  pipettesByMount: {} as any,
} as WizardFormState

const mockWizardTileProps: Partial<WizardTileProps> = {
  proceed: vi.fn(),
  setValue: vi.fn(),
  goBack: vi.fn(),
  watch: vi.fn((name: keyof typeof values) => values[name]) as any,
}

describe('SelectOt2Modules', () => {
  let props: ComponentProps<typeof SelectOt2Modules>

  beforeEach(() => {
    props = {
      ...mockWizardTileProps,
    } as WizardTileProps
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })
  it('renders the overall text', () => {
    render(props)
    screen.getByText('Step 2')
    screen.getByText('Add your modules')
    screen.getByText('Select modules to use in your protocol.')
  })

  it('renders the ot-2 options', () => {
    props = {
      ...props,
    }
    render(props)
    screen.getByText('Temperature Module GEN2')
    screen.getByText('Temperature Module GEN1')
    screen.getByText('Heater-Shaker Module GEN1')
    screen.getByText('Magnetic Module GEN2')
    screen.getByText('Magnetic Module GEN1')
    screen.getByText('Thermocycler Module GEN2')
    screen.getByText('Thermocycler Module GEN1')
  })
})
