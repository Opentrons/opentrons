import * as React from 'react'
import { it, describe, beforeEach, afterEach, expect, vi } from 'vitest'
import { fireEvent, cleanup } from '@testing-library/react'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../localization'
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

  afterEach(() => {
    cleanup()
  })

  it('the go back renders and clicking on it calls prop', () => {
    const { getByLabelText } = render(props)

    fireEvent.click(getByLabelText('GoBack_button'))
    expect(props.onClick).toHaveBeenCalled()
  })
})
