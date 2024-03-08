import * as React from 'react'
import { screen } from '@testing-library/react'
<<<<<<< HEAD
import { describe, it, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../__testing-utils__'
=======
import { describe, it, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { COLORS } from '@opentrons/components'
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
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
    }
  })
<<<<<<< HEAD
  it('should render text - downloading software', () => {
    render(props)
    screen.getByText('Downloading software...')
=======
  it('should render text and progressbar - downloading software', () => {
    render(props)
    screen.getByText('Downloading software...')
    const bar = screen.getByTestId('ProgressBar_Bar')
    expect(bar).toHaveStyle(`background: ${String(COLORS.blue50)}`)
    expect(bar).toHaveStyle('width: 50%')
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
  })
  it('should render text - sending software', () => {
    props = {
      ...props,
      updateType: 'sendingFile',
    }
    render(props)
    screen.getByText('Sending software...')
<<<<<<< HEAD
=======
    const bar = screen.getByTestId('ProgressBar_Bar')
    expect(bar).toHaveStyle('width: 20%')
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
  })
  it('should render text - validating software', () => {
    props = {
      ...props,
      updateType: 'validating',
    }
    render(props)
    screen.getByText('Validating software...')
<<<<<<< HEAD
=======
    const bar = screen.getByTestId('ProgressBar_Bar')
    expect(bar).toHaveStyle('width: 80%')
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
  })
  it('should render text - installing software', () => {
    props = {
      ...props,
      updateType: 'installing',
    }
    render(props)
    screen.getByText('Installing software...')
<<<<<<< HEAD
=======
    const bar = screen.getByTestId('ProgressBar_Bar')
    expect(bar).toHaveStyle('width: 5%')
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
  })
})
