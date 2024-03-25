import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, beforeEach } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { WellCount } from '../WellCount'

const render = (props: React.ComponentProps<typeof WellCount>) => {
  return renderWithProviders(<WellCount {...props} />, {
    i18nInstance: i18n,
  })
}

describe('WellCount', () => {
  let props: React.ComponentProps<typeof WellCount>
  beforeEach(() => {
    props = {
      count: 1,
      wellLabel: 'mockLabel',
    }
  })

  it('renders correct label and count', () => {
    render(props)
    screen.getByText('mockLabel Count')
    screen.getByText('1')
  })
})
