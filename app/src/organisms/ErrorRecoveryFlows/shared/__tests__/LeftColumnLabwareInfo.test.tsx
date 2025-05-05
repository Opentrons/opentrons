import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { InterventionContent } from '/app/molecules/InterventionModal/InterventionContent'
import { RECOVERY_MAP } from '/app/organisms/ErrorRecoveryFlows/constants'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { LeftColumnLabwareInfo } from '../LeftColumnLabwareInfo'

import type { ComponentProps } from 'react'

vi.mock('/app/molecules/InterventionModal/InterventionContent')

const render = (props: ComponentProps<typeof LeftColumnLabwareInfo>) => {
  return renderWithProviders(<LeftColumnLabwareInfo {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LeftColumnLabwareInfo', () => {
  let props: ComponentProps<typeof LeftColumnLabwareInfo>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
      title: 'MOCK_TITLE',
      failedLabwareUtils: {
        failedLabwareNames: {
          name: 'MOCK_LW_NAME',
          nickName: 'MOCK_LW_NICKNAME',
        },
        relevantPickUpTipLwNames: {
          name: 'MOCK_PICKUP_LW_NAME',
          nickName: 'MOCK_PICKUP_LW_NICKNAME',
        },
        failedLabwareLocations: {
          displayNameCurrentLoc: 'slot A1',
          displayNameNewLoc: 'slot B2',
        },
        relevantPickUpTipLwLocs: {
          displayNameCurrentLoc: 'slot C3',
        },
      } as any,
      type: 'location',
      layout: 'default',
      bannerText: 'MOCK_BANNER_TEXT',
      recoveryMap: {
        step: '',
        route: '',
      } as any,
    }

    vi.mocked(InterventionContent).mockReturnValue(
      <div>MOCK_INTERVENTION_CONTENT</div>
    )
  })

  it('renders the InterventionContent component with correct props for default case', () => {
    render(props)

    screen.getByText('MOCK_INTERVENTION_CONTENT')
    expect(vi.mocked(InterventionContent)).toHaveBeenCalledWith(
      expect.objectContaining({
        headline: 'MOCK_TITLE',
        infoProps: {
          layout: 'default',
          type: 'location',
          labwareName: 'MOCK_LW_NAME',
          labwareNickname: 'MOCK_LW_NICKNAME',
          currentLocationProps: { deckLabel: 'SLOT A1' },
          newLocationProps: { deckLabel: 'SLOT B2' },
          subText: undefined,
          tagText: null,
        },
        notificationProps: {
          type: 'alert',
          heading: 'MOCK_BANNER_TEXT',
        },
      }),
      {}
    )
  })

  it(`renders with correct props for ${RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.REPLACE_TIPS} step`, () => {
    props.recoveryMap = {
      route: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE,
      step: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.REPLACE_TIPS,
    }
    render(props)

    expect(vi.mocked(InterventionContent)).toHaveBeenCalledWith(
      expect.objectContaining({
        infoProps: expect.objectContaining({
          labwareName: 'MOCK_PICKUP_LW_NAME',
          labwareNickname: 'MOCK_PICKUP_LW_NICKNAME',
          currentLocationProps: { deckLabel: 'SLOT C3' },
        }),
      }),
      {}
    )
  })

  it(`renders with correct props for ${RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.SELECT_TIPS} step`, () => {
    props.recoveryMap = {
      route: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE,
      step: RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.SELECT_TIPS,
    }
    render(props)

    expect(vi.mocked(InterventionContent)).toHaveBeenCalledWith(
      expect.objectContaining({
        infoProps: expect.objectContaining({
          labwareName: 'MOCK_PICKUP_LW_NAME',
          labwareNickname: 'MOCK_PICKUP_LW_NICKNAME',
          currentLocationProps: { deckLabel: 'SLOT C3' },
        }),
      }),
      {}
    )
  })

  it('does not include notificationProps when bannerText is not provided', () => {
    props.bannerText = undefined
    render(props)

    expect(vi.mocked(InterventionContent)).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationProps: undefined,
      }),
      {}
    )
  })

  it('does not include newLocationProps when newLoc is not provided', () => {
    props.failedLabwareUtils.failedLabwareLocations.displayNameNewLoc = null
    render(props)

    expect(vi.mocked(InterventionContent)).toHaveBeenCalledWith(
      expect.objectContaining({
        infoProps: expect.not.objectContaining({
          newLocationProps: expect.anything(),
        }),
      }),
      {}
    )
  })

  it('converts location labels to uppercase', () => {
    props.failedLabwareUtils.failedLabwareLocations = {
      displayNameCurrentLoc: 'slot A1',
      displayNameNewLoc: 'slot B2',
      newLoc: {} as any,
      currentLoc: {} as any,
    }

    render(props)

    expect(vi.mocked(InterventionContent)).toHaveBeenCalledWith(
      expect.objectContaining({
        infoProps: expect.objectContaining({
          currentLocationProps: { deckLabel: 'SLOT A1' },
          newLocationProps: { deckLabel: 'SLOT B2' },
        }),
      }),
      {}
    )
  })
})
