import { screen } from '@testing-library/react'
import { beforeEach, describe, it } from 'vitest'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import { WellContents } from '../WellContents'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof WellContents>) => {
  return renderWithProviders(<WellContents {...props} />, {
    i18nInstance: i18n,
  })
}

describe('WellContents', () => {
  let props: ComponentProps<typeof WellContents>
  beforeEach(() => {
    props = {
      wellName: 'mockWellName',
      volume: 100,
    }
  })
  it('should render text', () => {
    render(props)
    screen.getByText('mockWellName')
    screen.getByText('100 µL')
  })
})
