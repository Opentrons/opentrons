import type * as React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen, cleanup } from '@testing-library/react'
import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { EquipmentOption } from '../../CreateFileWizard/EquipmentOption'
import { ModuleFields } from '../../FilePipettesModal/ModuleFields'
import type { FormPipettesByMount } from '../../../../step-forms'
import type { FormState, WizardTileProps } from '../../CreateFileWizard/types'

vi.mock('../../CreateFileWizard/EquipmentOption')

const render = (props: React.ComponentProps<typeof ModuleFields>) => {
  return renderWithProviders(<ModuleFields {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const values = {
  fields: {
    name: 'mockName',
    description: 'mockDescription',
    organizationOrAuthor: 'mockOrganizationOrAuthor',
    robotType: OT2_ROBOT_TYPE,
  },
  pipettesByMount: {
    left: { pipetteName: 'p1000_single_flex', tiprackDefURI: ['mocktip'] },
    right: { pipetteName: null, tiprackDefURI: null },
  } as FormPipettesByMount,
  modules: {},
  additionalEquipment: ['trashBin'],
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

describe('ModuleFields', () => {
  let props: React.ComponentProps<typeof ModuleFields>

  beforeEach(() => {
    props = {
      ...props,
      ...mockWizardTileProps,
    } as WizardTileProps
    vi.mocked(EquipmentOption).mockReturnValue(<div>mock EquipmentOption</div>)
  })

  afterEach(() => {
    cleanup()
  })

  it('renders correct module length for ot-2', () => {
    render(props)
    expect(screen.getAllByText('mock EquipmentOption')).toHaveLength(7)
  })
})
