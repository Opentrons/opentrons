import * as React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen, cleanup } from '@testing-library/react'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import { renderWithProviders } from '../../../../__testing-utils__' 
import { i18n } from '../../../../localization'
import { getDisableModuleRestrictions } from '../../../../feature-flags/selectors'
import { CrashInfoBox } from '../../../modules'
import { ModuleFields } from '../../FilePipettesModal/ModuleFields'
import { ModulesAndOtherTile } from '../ModulesAndOtherTile'
import { EquipmentOption } from '../EquipmentOption'
import type { FormPipettesByMount } from '../../../../step-forms'
import type { FormState, WizardTileProps } from '../types'

vi.mock('../../../modules')
vi.mock('../../FilePipettesModal/ModuleFields')
vi.mock('../EquipmentOption')
vi.mock('../../../../feature-flags/selectors')
vi.mock('../../FilePipettesModal')

const render = (props: React.ComponentProps<typeof ModulesAndOtherTile>) => {
  return renderWithProviders(<ModulesAndOtherTile {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const values = {
  fields: {
    name: 'mockName',
    description: 'mockDescription',
    organizationOrAuthor: 'mockOrganizationOrAuthor',
    robotType: FLEX_ROBOT_TYPE,
  },
  pipettesByMount: {
    left: { pipetteName: 'mockPipetteName', tiprackDefURI: 'mocktip' },
    right: { pipetteName: null, tiprackDefURI: null },
  } as FormPipettesByMount,
  modulesByType: {
    heaterShakerModuleType: { onDeck: false, model: null, slot: '1' },
    magneticBlockType: { onDeck: false, model: null, slot: '2' },
    temperatureModuleType: { onDeck: false, model: null, slot: '3' },
    thermocyclerModuleType: { onDeck: false, model: null, slot: '4' },
  },
  additionalEquipment: ['gripper'],
} as FormState

const mockWizardTileProps: Partial<WizardTileProps> = {
  watch: vi.fn((name: keyof typeof values) => values[name]) as any,
  trigger: vi.fn(),
  goBack: vi.fn(),
  proceed: vi.fn(),
  setValue: vi.fn(),
  getValues: vi.fn(() => values) as any,
  formState: {} as any,
}

describe('ModulesAndOtherTile', () => {
  let props: React.ComponentProps<typeof ModulesAndOtherTile>

  beforeEach(() => {
    props = {
      ...props,
      ...mockWizardTileProps,
    } as WizardTileProps
    vi.mocked(CrashInfoBox).mockReturnValue(<div> mock CrashInfoBox</div>)
    vi.mocked(EquipmentOption).mockReturnValue(<div>mock EquipmentOption</div>)
    vi.mocked(getDisableModuleRestrictions).mockReturnValue(false)
    vi.mocked(ModuleFields).mockReturnValue(<div>mock ModuleFields</div>)
  })

  afterEach(() => {
    cleanup()
  })

  it('renders correct module, gripper and trash length for flex with disabled button', () => {
    render(props)
    screen.getByText('Choose additional items')
    expect(screen.getAllByText('mock EquipmentOption')).toHaveLength(7)
    screen.getByText('Go back')
    fireEvent.click(screen.getByRole('button', { name: 'GoBack_button' }))
    expect(props.goBack).toHaveBeenCalled()
    expect(screen.getByText('Review file details')).toBeDisabled()
  })
  it('renders correct module, gripper and trash length for flex', () => {
    const newValues = {
      ...values,
      additionalEquipment: ['trashBin'],
    }
    props = {
      ...props,
      getValues: vi.fn(() => newValues) as any,
    }
    render(props)
    screen.getByText('Choose additional items')
    expect(screen.getAllByText('mock EquipmentOption')).toHaveLength(7)
    screen.getByText('Go back')
    fireEvent.click(screen.getByRole('button', { name: 'GoBack_button' }))
    expect(props.goBack).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Review file details'))
    expect(props.proceed).toHaveBeenCalled()
  })
  it('renders correct module length for ot-2', () => {
    const values = {
      fields: {
        robotType: OT2_ROBOT_TYPE,
      },
      pipettesByMount: {
        left: { pipetteName: 'p1000_single', tiprackDefURI: 'mocktip' },
        right: { pipetteName: null, tiprackDefURI: null },
      } as FormPipettesByMount,
      modulesByType: {
        heaterShakerModuleType: { onDeck: false, model: null, slot: '1' },
        magneticModuleType: { onDeck: false, model: null, slot: '2' },
        temperatureModuleType: { onDeck: false, model: null, slot: '3' },
        thermocyclerModuleType: { onDeck: false, model: null, slot: '4' },
      },
    } as FormState

    const mockWizardTileProps: Partial<WizardTileProps> = {
      formState: {
        errors: { modulesByType: {} },
        touchedFields: { modulesByType: {} },
      } as any,
      getValues: vi.fn(() => values) as any,
    }
    props = {
      ...props,
      ...mockWizardTileProps,
    } as WizardTileProps
    render(props)
    screen.getByText('Choose additional items')
    screen.getByText('mock ModuleFields')
    screen.getByText('mock CrashInfoBox')
    screen.getByText('Go back')
    screen.getByText('Review file details')
  })
})
