import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { actions as featureFlagActions } from '/protocol-designer/feature-flags'

import { FeatureFlag } from '..'

import type { ComponentProps } from 'react'

vi.mock('/protocol-designer/feature-flags')

const render = (props: ComponentProps<typeof FeatureFlag>) => {
  return renderWithProviders(<FeatureFlag {...props} />, {
    i18nInstance: i18n,
  })
}

describe('FeatureFlag', () => {
  let props: ComponentProps<typeof FeatureFlag>
  beforeEach(() => {
    props = {
      flags: {
        PRERELEASE_MODE: true,
        OT_PD_ENABLE_COMMENT: true,
        OT_PD_ENABLE_REACT_SCAN: true,
      },
    }
  })

  it('renders the feature flags section', () => {
    render(props)
    screen.getByText('Developer Feature Flags')
    screen.getByText('Use prerelease mode')
    screen.getByText('Show in-progress features for testing & internal use')
    screen.getByText('Enable comment step')
    screen.getByText('You can add comments anywhere between timeline steps.')
    screen.getByText('Enable React Scan')
    screen.getByText('Enable React Scan support for components rendering check')
    expect(screen.getAllByRole('switch').length).toBe(3)
  })
  it('should call function when clicking toggle switches', () => {
    render(props)
    const toggleButtons = screen.getAllByRole('switch')

    fireEvent.click(toggleButtons[0])
    expect(vi.mocked(featureFlagActions.setFeatureFlags)).toHaveBeenCalledWith({
      PRERELEASE_MODE: false,
    })

    fireEvent.click(toggleButtons[1])
    expect(vi.mocked(featureFlagActions.setFeatureFlags)).toHaveBeenCalledWith({
      OT_PD_ENABLE_COMMENT: false,
    })

    fireEvent.click(toggleButtons[2])
    expect(vi.mocked(featureFlagActions.setFeatureFlags)).toHaveBeenCalledWith({
      OT_PD_ENABLE_REACT_SCAN: false,
    })
  })
})
