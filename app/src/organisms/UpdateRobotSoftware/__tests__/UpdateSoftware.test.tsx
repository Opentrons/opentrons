import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { COLORS } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { UpdateSoftware } from '../UpdateSoftware'

const render = (props: React.ComponentProps<typeof UpdateSoftware>) => {
  return renderWithProviders(<UpdateSoftware {...props} />, {
    i18nInstance: i18n,
  })
}

describe('UpdateSoftware', () => {
  let props: React.ComponentProps<typeof UpdateSoftware>
  beforeEach(() => {
    props = {
      updateType: 'downloading',
      processProgress: 50,
    }
  })
  it('should render text and progressbar - downloading software', () => {
    render(props)
    screen.getByText('Downloading software...')
    const bar = screen.getByTestId('ProgressBar_Bar')
    expect(bar).toHaveStyle(`background: ${String(COLORS.blue50)}`)
    expect(bar).toHaveStyle('width: 50%')
  })
  it('should render text and progressbar - sending software', () => {
    props = {
      ...props,
      processProgress: 20,
      updateType: 'sendingFile',
    }
    render(props)
    screen.getByText('Sending software...')
    const bar = screen.getByTestId('ProgressBar_Bar')
    expect(bar).toHaveStyle('width: 20%')
  })
  it('should render text and progressbar - validating software', () => {
    props = {
      ...props,
      processProgress: 80,
      updateType: 'validating',
    }
    render(props)
    screen.getByText('Validating software...')
    const bar = screen.getByTestId('ProgressBar_Bar')
    expect(bar).toHaveStyle('width: 80%')
  })
  it('should render text and progressbar - installing software', () => {
    props = {
      ...props,
      processProgress: 5,
      updateType: 'installing',
    }
    render(props)
    screen.getByText('Installing software...')
    const bar = screen.getByTestId('ProgressBar_Bar')
    expect(bar).toHaveStyle('width: 5%')
  })
})
