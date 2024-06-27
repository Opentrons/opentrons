import * as React from 'react'
import { describe, it, beforeEach, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../../__testing-utils__'
import { mockRecoveryContentProps } from '../../__fixtures__'
import { i18n } from '../../../../i18n'
import { LeftColumnLabwareInfo } from '../LeftColumnLabwareInfo'
import { Move } from '../../../../molecules/InterventionModal/InterventionStep'
import { InlineNotification } from '../../../../atoms/InlineNotification'

vi.mock('../../../../molecules/InterventionModal/InterventionStep')
vi.mock('../../../../atoms/InlineNotification')

const render = (props: React.ComponentProps<typeof LeftColumnLabwareInfo>) => {
  return renderWithProviders(<LeftColumnLabwareInfo {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LeftColumnLabwareInfo', () => {
  let props: React.ComponentProps<typeof LeftColumnLabwareInfo>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
      title: 'MOCK_TITLE',
      failedLabwareUtils: {
        failedLabwareName: 'MOCK_LW_NAME',
        failedLabware: {
          location: { slotName: 'A1' },
        },
      } as any,
      moveType: 'refill',
      bannerText: 'MOCK_BANNER_TEXT',
    }

    vi.mocked(Move).mockReturnValue(<div>MOCK_MOVE</div>)
    vi.mocked(InlineNotification).mockReturnValue(
      <div>MOCK_INLINE_NOTIFICATION</div>
    )
  })

  it('renders the title, Move component, and InlineNotification when bannerText is provided', () => {
    render(props)

    screen.getByText('MOCK_TITLE')
    screen.getByText('MOCK_MOVE')
    expect(vi.mocked(Move)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'refill',
        labwareName: 'MOCK_LW_NAME',
        currentLocationProps: { slotName: 'A1' },
      }),
      {}
    )
    screen.getByText('MOCK_INLINE_NOTIFICATION')
    expect(vi.mocked(InlineNotification)).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'alert',
        heading: 'MOCK_BANNER_TEXT',
      }),
      {}
    )
  })

  it('does not render the InlineNotification when bannerText is not provided', () => {
    props.bannerText = undefined
    render(props)

    screen.getByText('MOCK_TITLE')
    screen.getByText('MOCK_MOVE')
    expect(screen.queryByText('MOCK_INLINE_NOTIFICATION')).toBeNull()
  })

  it('returns an empty string for slotName when failedLabware location is not an object with slotName', () => {
    // @ts-expect-error yeah this is ok
    props.failedLabwareUtils.failedLabware.location = 'offDeck'
    render(props)

    expect(vi.mocked(Move)).toHaveBeenCalledWith(
      expect.objectContaining({
        currentLocationProps: { slotName: '' },
      }),
      {}
    )
  })
})
