import { useSearchParams } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { CameraPhotoViewer } from '..'

vi.mock('react-router-dom')

const render = () => {
  return renderWithProviders(<CameraPhotoViewer />, {
    i18nInstance: i18n,
  })
}

describe('CameraPhotoViewer', () => {
  beforeEach(() => {
    vi.mocked(useSearchParams).mockReturnValue([
      { get: () => 'path/to/photo' } as any,
      vi.fn(),
    ])
  })

  it('renders the image when the photo URL is provided', () => {
    render()

    screen.getByAltText('camera-capture')
  })

  it('renders the loading copy when the photo URL is not provided', () => {
    vi.mocked(useSearchParams).mockReturnValue([
      { get: () => null } as any,
      vi.fn(),
    ])

    render()

    screen.getByText('Image loading')
  })
})
