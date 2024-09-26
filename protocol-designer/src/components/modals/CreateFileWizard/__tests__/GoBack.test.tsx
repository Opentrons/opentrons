import type * as React from 'react'
import { it, describe, beforeEach, expect, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { GoBack } from '../GoBack'

const render = (props: React.ComponentProps<typeof GoBack>) => {
  return renderWithProviders(<GoBack {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('GoBack', () => {
  let props: React.ComponentProps<typeof GoBack>

  beforeEach(() => {
    props = {
      onClick: vi.fn(),
    }
  })

  it('the go back renders and clicking on it calls prop', () => {
    render(props)

    fireEvent.click(screen.getByLabelText('GoBack_button'))
    expect(props.onClick).toHaveBeenCalled()
  })
})
