import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, beforeEach, vi, expect } from 'vitest'

import { renderWithProviders } from '../../../../__testing-utils__'
import { ProtocolDropTipBanner } from '../ProtocolDropTipBanner'
import { i18n } from '../../../../i18n'

const render = (props: React.ComponentProps<typeof ProtocolDropTipBanner>) => {
  return renderWithProviders(<ProtocolDropTipBanner {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('Module Update Banner', () => {
  let props: React.ComponentProps<typeof ProtocolDropTipBanner>

  beforeEach(() => {
    props = {
      onCloseClick: vi.fn(),
      onLaunchWizardClick: vi.fn(),
    }
  })

  it('displays appropriate banner text', () => {
    const { getByText, queryByText } = render(props)
    getByText('Tips may be attached.')
    queryByText('You may want to remove tips')
    getByText('Remove tips')
  })

  it('launches the drop tip wizard when clicking on the appropriate banner text', () => {
    render(props)
    expect(props.onLaunchWizardClick).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Remove tips'))
    expect(props.onLaunchWizardClick).toHaveBeenCalled()
  })

  it('closes the banner when clicking the appropriate button', () => {
    render(props)
    expect(props.onCloseClick).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('Banner_close-button'))
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
