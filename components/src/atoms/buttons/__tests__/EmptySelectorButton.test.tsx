import * as React from 'react'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '../../../testing/utils'
import { EmptySelectorButton } from '../EmptySelectorButton'

const render = (props: React.ComponentProps<typeof EmptySelectorButton>) => {
  return renderWithProviders(<EmptySelectorButton {...props} />)[0]
}

describe('EmptySelectorButton', () => {
  let props: React.ComponentProps<typeof EmptySelectorButton>
  beforeEach(() => {
    props = {
      onClick: vi.fn(),
      text: 'mock text',
      iconName: 'add',
      textAlignment: 'left',
      size: 'large',
    }
  })
  it('renders the props and button cta', () => {
    render(props)
    fireEvent.click(screen.getByText('mock text'))
    expect(props.onClick).toHaveBeenCalled()
    screen.getByTestId('EmptySelectorButton_add')
  })
})
