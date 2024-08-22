import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../assets/localization'
import { renderWithProviders } from '../../../__testing-utils__'
import { getLabwareDefsByURI } from '../../../labware-defs/selectors'
import { PipetteInfoItem } from '../PipetteInfoItem'

import type { WizardFormState } from '../types'

vi.mock('../../../labware-defs/selectors')

const render = (props: React.ComponentProps<typeof PipetteInfoItem>) => {
  return renderWithProviders(<PipetteInfoItem {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const values = {
  additionalEquipment: [],
  fields: {
    name: '',
    description: '',
    organizationOrAuthor: '',
    robotType: FLEX_ROBOT_TYPE,
  },
  pipettesByMount: {
    left: { pipetteName: 'p1000_single' },
    right: { pipetteName: 'p50_single' },
  },
  modules: null,
} as WizardFormState

describe('PipetteInfoItem', () => {
  let props: React.ComponentProps<typeof PipetteInfoItem>

  beforeEach(() => {
    props = {
      watch: vi.fn((name: keyof typeof values) => values[name]) as any,
      editClick: vi.fn(),
      setValue: vi.fn(),
      cleanForm: vi.fn(),
      tiprackDefURIs: ['mockDefUri'],
      pipetteName: 'p1000_single',
      mount: 'left',
    }

    vi.mocked(getLabwareDefsByURI).mockReturnValue({
      mockDefUri: { metadata: { displayName: 'mock display name' } } as any,
    })
  })
  it('renders pipette with edit and remove buttons', () => {
    render(props)
    screen.getByText('P1000 Single-Channel GEN1')
    screen.getByText('Left pipette')
    screen.getByText('mock display name')
    fireEvent.click(screen.getByText('Edit'))
    expect(props.editClick).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Remove'))
    expect(props.setValue).toHaveBeenCalled()
    expect(props.cleanForm).toHaveBeenCalled()
  })
})
