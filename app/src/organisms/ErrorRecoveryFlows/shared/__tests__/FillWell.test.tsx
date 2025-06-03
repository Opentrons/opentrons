import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { FillWell } from '/app/organisms/ErrorRecoveryFlows/shared'

import { mockRecoveryContentProps } from '../../__fixtures__'

import type { ComponentProps } from 'react'

vi.mock('../LeftColumnLabwareInfo', () => ({
  LeftColumnLabwareInfo: vi.fn(props => (
    <div>
      MOCK_LEFT_COLUMN_LABWARE_INFO
      <span data-testid="labware-info-title">{props.title}</span>
    </div>
  )),
}))
vi.mock('/app/molecules/InterventionModal/DeckMapContent', () => ({
  DeckMapContent: vi.fn(() => <div>MOCK_RECOVERY_MAP</div>),
}))

const render = (props: ComponentProps<typeof FillWell>) => {
  return renderWithProviders(<FillWell {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('FillWell', () => {
  let props: ComponentProps<typeof FillWell>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
    }
  })

  it('renders expected components', () => {
    render(props)
    expect(screen.getByTestId('labware-info-title').textContent).toContain(
      'Manually fill liquid in well'
    )
    screen.getByText('MOCK_RECOVERY_MAP')
  })
})
