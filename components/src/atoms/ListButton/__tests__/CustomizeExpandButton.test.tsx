import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CustomizeExpandButton } from '..'
import { renderWithProviders } from '../../../testing/utils'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof CustomizeExpandButton>) =>
  renderWithProviders(<CustomizeExpandButton {...props} />)

describe('CustomizeExpandButton', () => {
  let props: ComponentProps<typeof CustomizeExpandButton>

  beforeEach(() => {
    props = {
      buttonText: 'mock text',
      buttonValue: 'mockValue',
      onChange: vi.fn(),
      t: {} as any,
    }
  })

  it('should render non nested accordion', () => {
    render(props)
    fireEvent.click(screen.getByText('mock text'))
    expect(props.onChange).toHaveBeenCalled()
  })
  // TODO: add more test coverage for the stackingProps
})
