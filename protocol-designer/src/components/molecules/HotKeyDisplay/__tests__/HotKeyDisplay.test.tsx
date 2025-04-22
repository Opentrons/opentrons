import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { HotKeyDisplay } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { getUserOS } from '../../../../pages/Designer/ProtocolSteps/Timeline/utils'

import type { ComponentProps } from 'react'

vi.mock('../../../../pages/Designer/ProtocolSteps/Timeline/utils')

const render = (props: ComponentProps<typeof HotKeyDisplay>) => {
  return renderWithProviders(<HotKeyDisplay {...props} />, {
    i18nInstance: i18n,
  })
}

describe('HotKeyDisplay', () => {
  let props: ComponentProps<typeof HotKeyDisplay>

  beforeEach(() => {
    props = {
      targetWidth: 285,
    }
    vi.mocked(getUserOS).mockReturnValue('Mac OS')
  })

  it('renders the hot keys display for mac', () => {
    render(props)
    screen.getByText('Double-click to edit')
    screen.getByText('⇧ + click to select range')
    screen.getByText('⌘ + click to select multiple')
  })

  it('renders the hot keys display for windows', () => {
    vi.mocked(getUserOS).mockReturnValue('Windows')
    render(props)
    screen.getByText('Double-click to edit')
    screen.getByText('⇧ + click to select range')
    screen.getByText('^ + click to select multiple')
  })
})
