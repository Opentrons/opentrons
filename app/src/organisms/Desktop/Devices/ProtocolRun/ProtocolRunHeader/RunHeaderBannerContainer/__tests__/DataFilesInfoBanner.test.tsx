import { useNavigate } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { DataFilesInfoBanner } from '../DataFilesInfoBanner'

import type { Mock } from 'vitest'
import type { DataFilesInfoBannerProps } from '../DataFilesInfoBanner'

vi.mock('react-router-dom')

const render = (props: DataFilesInfoBannerProps) => {
  return renderWithProviders(<DataFilesInfoBanner {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DataFilesInfoBanner', () => {
  let mockNavigate: Mock
  let mockProps: DataFilesInfoBannerProps

  beforeEach(() => {
    mockNavigate = vi.fn()
    mockProps = {
      hasImages: true,
      hasCsvFiles: true,
      robotName: 'test-robot',
    }
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
  })

  it('renders download image files header when appropriate', () => {
    render(mockProps)

    screen.getByText('Download image files')
  })

  it('renders download files header when appropriate', () => {
    const propsWithoutImages = {
      ...mockProps,
      hasImages: false,
    }
    render(propsWithoutImages)

    screen.getByText('Download files')
  })

  it('renders all available download text when when appropriate', () => {
    render(mockProps)

    screen.getByText(
      'All files associated with the run are available on the robot’s Recent Runs screen. Image files can also be accessed in the Camera tab.'
    )
  })

  it('renders images available download text when when appropriate', () => {
    const propsWithImagesOnly = {
      ...mockProps,
      hasCsvFiles: false,
    }
    render(propsWithImagesOnly)

    screen.getByText(
      'Image files associated with the run are available on the robot’s Recent Runs screen and Camera tab.'
    )
  })

  it('renders csv available download text when when appropriate', () => {
    const propsWithCsvOnly = {
      ...mockProps,
      hasImages: false,
      hasCsvFiles: true,
    }
    render(propsWithCsvOnly)

    screen.getByText(
      'All files associated with the run are available on the robot’s Recent Runs screen.'
    )
  })

  it('renders view recent runs link', () => {
    render(mockProps)

    screen.getByText('View Recent Runs')
  })

  it('navigates to recent runs when link is clicked', () => {
    render(mockProps)

    const link = screen.getByText('View Recent Runs')
    fireEvent.click(link)

    expect(mockNavigate).toHaveBeenCalledWith(
      '/devices/test-robot/#recent-protocol-runs'
    )
  })

  it('navigates with correct robot name', () => {
    const propsWithDifferentRobot = {
      ...mockProps,
      robotName: 'different-robot',
    }
    render(propsWithDifferentRobot)

    const link = screen.getByText('View Recent Runs')
    fireEvent.click(link)

    expect(mockNavigate).toHaveBeenCalledWith(
      '/devices/different-robot/#recent-protocol-runs'
    )
  })
})
