import { screen } from '@testing-library/react'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { clickButtonLabeled } from '/app/organisms/ErrorRecoveryFlows/__tests__/util'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { RECOVERY_MAP } from '../../constants'
import { TwoColTextAndImage } from '../TwoColTextAndImage'

vi.mock('@opentrons/components', async () => {
  const actual = await vi.importActual('@opentrons/components')
  return {
    ...actual,
    MoveLabwareOnDeck: vi.fn(),
  }
})

let mockProceedNextStep: Mock
let mockGoBackPrevStep: Mock

const render = (props: ComponentProps<typeof TwoColTextAndImage>) => {
  return renderWithProviders(<TwoColTextAndImage {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TwoColTextAndImage', () => {
  let props: ComponentProps<typeof TwoColTextAndImage>

  beforeEach(() => {
    mockProceedNextStep = vi.fn()
    mockGoBackPrevStep = vi.fn()

    props = {
      routeUpdateActions: {
        proceedNextStep: mockProceedNextStep,
        goBackPrevStep: mockGoBackPrevStep,
      },
      recoveryMap: {
        route: RECOVERY_MAP.LOAD_LABWARE_SHUTTLE_AND_RETRY.ROUTE,
        step: RECOVERY_MAP.LOAD_LABWARE_SHUTTLE_AND_RETRY.STEPS.MANUAL_REPLACE,
      },
    } as any
  })

  it('calls proceedNextStep when primary button is clicked', () => {
    render(props)
    clickButtonLabeled('Continue')
    expect(mockProceedNextStep).toHaveBeenCalled()
  })

  it(`passes correct title for ${RECOVERY_MAP.LOAD_LABWARE_SHUTTLE_AND_RETRY.ROUTE}`, () => {
    render(props)
    screen.getByText('Load labware shuttle onto track')
    screen.getByText(
      'Take any necessary precautions before loading the labware shuttle onto the track.'
    )
  })
})
