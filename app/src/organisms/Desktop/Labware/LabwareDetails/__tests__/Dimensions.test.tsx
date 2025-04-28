import { screen } from '@testing-library/react'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { mockDefinition } from '/app/redux/custom-labware/__fixtures__'
import type { ComponentProps } from 'react'
import { beforeEach, describe, it } from 'vitest'
import { Dimensions } from '../Dimensions'

const render = (props: ComponentProps<typeof Dimensions>) => {
  return renderWithProviders(<Dimensions {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Dimensions', () => {
  let props: ComponentProps<typeof Dimensions>
  beforeEach(() => {
    props = {
      definition: mockDefinition,
    }
  })

  it('renders correct label and headings', () => {
    render(props)
    screen.getByText('Footprint (mm)')
    screen.getByRole('heading', { name: 'height' })
    screen.getByRole('heading', { name: 'width' })
    screen.getByRole('heading', { name: 'length' })
  })
})
