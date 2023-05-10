import * as React from 'react'
import { renderWithProviders, COLORS } from '@opentrons/components'
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
    const [{ getByText, getByTestId }] = render(props)
    getByText('Downloading software...')
    const bar = getByTestId('ProgressBar_Bar')
    expect(bar).toHaveStyle(`background: ${String(COLORS.blueEnabled)}`)
    expect(bar).toHaveStyle('width: 50%')
  })
  it('should render text and progressbar - sending software', () => {
    props = {
      ...props,
      processProgress: 20,
      updateType: 'sendingFile',
    }
    const [{ getByText, getByTestId }] = render(props)
    getByText('Sending software...')
    const bar = getByTestId('ProgressBar_Bar')
    expect(bar).toHaveStyle('width: 20%')
  })
  it('should render text and progressbar - validating software', () => {
    props = {
      ...props,
      processProgress: 80,
      updateType: 'validating',
    }
    const [{ getByText, getByTestId }] = render(props)
    getByText('Validating software...')
    const bar = getByTestId('ProgressBar_Bar')
    expect(bar).toHaveStyle('width: 80%')
  })
  it('should render text and progressbar - installing software', () => {
    props = {
      ...props,
      processProgress: 5,
      updateType: 'installing',
    }
    const [{ getByText, getByTestId }] = render(props)
    getByText('Installing software...')
    const bar = getByTestId('ProgressBar_Bar')
    expect(bar).toHaveStyle('width: 5%')
  })
})
