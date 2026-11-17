import { useSelector } from 'react-redux'
import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { ChildNavigation } from '/app/components/ODD/headers/ChildNavigation'
import { i18n } from '/app/i18n'
import { mockLPCContentProps } from '/app/organisms/LabwarePositionCheck/__fixtures__/mockLPCContentProps'
import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'

import type { ComponentProps } from 'react'
import type { StepMeter } from '@opentrons/components'

vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal<typeof useSelector>()
  return {
    ...actual,
    useSelector: vi.fn(),
  }
})
vi.mock('/app/components/ODD/headers/ChildNavigation')
vi.mock('@opentrons/components', async importOriginal => {
  const actualComponents = await importOriginal<typeof StepMeter>()
  return {
    ...actualComponents,
    StepMeter: vi.fn(({ children }) => <div>MOCK_STEP_METER</div>),
  }
})

const render = (props: ComponentProps<typeof LPCContentContainer>) => {
  return renderWithProviders(<LPCContentContainer {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LPCContentContainer', () => {
  let props: ComponentProps<typeof LPCContentContainer>

  beforeEach(() => {
    props = {
      header: 'MOCK_HEADER',
      ...mockLPCContentProps,
      children: <div>MOCK_CHILDREN</div>,
      desktopHeaderBtnCopy: '',
      desktopFooterBtnCopy: '',
      oddHeaderBtnCopy: '',
    }

    vi.mocked(ChildNavigation).mockReturnValue(<div>MOCK_CHILD_NAV</div>)
    vi.mocked(useSelector).mockReturnValue({
      currentStepIndex: 1,
      totalStepCount: 5,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders correct content and children', () => {
    render(props)

    screen.getByText('MOCK_CHILDREN')
    screen.getByText('MOCK_CHILD_NAV')
    screen.getByText('MOCK_STEP_METER')
  })
})
