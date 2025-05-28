import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { mockRecoveryContentProps } from '/app/organisms/ErrorRecoveryFlows/__fixtures__'
import { clickButtonLabeled } from '/app/organisms/ErrorRecoveryFlows/__tests__/util'

import { RECOVERY_MAP } from '../../constants'
import { ReleaseLabware } from '../ReleaseLabware'

import type { Mock } from 'vitest'
import type { ComponentProps } from 'react'

vi.mock('/app/assets/videos/error-recovery/Gripper_Release.webm', () => ({
  default: 'mocked-animation-path.webm',
}))

const render = (props: ComponentProps<typeof ReleaseLabware>) => {
  return renderWithProviders(<ReleaseLabware {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ReleaseLabware', () => {
  let props: ComponentProps<typeof ReleaseLabware>
  let mockHandleMotionRouting: Mock

  beforeEach(() => {
    mockHandleMotionRouting = vi.fn(() => Promise.resolve())

    props = {
      ...mockRecoveryContentProps,
      routeUpdateActions: {
        handleMotionRouting: mockHandleMotionRouting,
        goBackPrevStep: vi.fn(),
      } as any,
    }
  })

  it('renders gripper copy', () => {
    render(props)

    screen.getByText('Release labware from gripper')
    screen.getByText(
      'Take any necessary precautions before positioning yourself to stabilize or catch the labware. Once confirmed, a countdown will begin before the gripper releases.'
    )
    screen.getByText('The labware will be released from its current height.')
  })

  it('renders latch copy', () => {
    props.recoveryMap = {
      route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE,
      step:
        RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.STEPS.CONFIRM_LABWARE_IN_LATCH,
    }
    render(props)

    screen.getByText('Release labware from latch')
    screen.getByText(
      'Take any necessary precautions before positioning yourself to stabilize or catch the labware. Once confirmed, a countdown will begin before the gripper releases.'
    )
    screen.getByText('The labware will be released from its current height.')
  })

  it('clicking the primary button has correct behavior', () => {
    render(props)

    clickButtonLabeled('Release')

    expect(mockHandleMotionRouting).toHaveBeenCalled()
  })

  it('renders gripper animation', () => {
    render(props)

    screen.getByRole('presentation', { hidden: true })
    expect(screen.getByTestId('gripper-animation')).toHaveAttribute(
      'src',
      'mocked-animation-path.webm'
    )
  })
})
