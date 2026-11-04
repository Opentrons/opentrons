import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { CodeBlock } from '.'
import { renderWithProviders } from '../../testing/utils'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof CodeBlock>) => {
  return renderWithProviders(<CodeBlock {...props} />)
}

const mockCode =
  'NoLiquidClassPropertyError [line 142]: Default liquid classes are not supported with OT-2 pipettes and tip racks.'

describe('CodeBlock', () => {
  let props: ComponentProps<typeof CodeBlock>

  beforeEach(() => {
    props = { children: mockCode }
  })

  it('should render code', () => {
    render(props)
    expect(screen.getByText(mockCode)).toBeInTheDocument()
  })
})
