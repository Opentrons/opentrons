import { useSelector } from 'react-redux'
import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import {
  MockLPCContentContainer,
  mockLPCContentProps,
} from '/app/organisms/LabwarePositionCheck/__fixtures__'
import { LPCWizardContent } from '/app/organisms/LabwarePositionCheck/LPCWizardFlex'

import type { ComponentProps } from 'react'

vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal<typeof useSelector>()
  return {
    ...actual,
    useSelector: vi.fn(),
  }
})

vi.mock('/app/organisms/LabwarePositionCheck/LPCContentContainer', () => ({
  LPCContentContainer: MockLPCContentContainer,
}))

const render = (props: ComponentProps<typeof LPCWizardContent>) => {
  return renderWithProviders(<LPCWizardContent {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LPCWizardContent', () => {
  let props: ComponentProps<typeof LPCWizardContent>

  beforeEach(() => {
    props = {
      ...mockLPCContentProps,
      commandUtils: {
        ...mockLPCContentProps.commandUtils,
        isRobotMoving: true,
      },
    }
  })

  it('renders the stand back message while the robot is moving', () => {
    render(props)
    screen.getByText('Stand back, robot is in motion')
  })
})
