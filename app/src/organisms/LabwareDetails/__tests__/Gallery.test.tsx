import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { mockDefinition } from '../../../redux/custom-labware/__fixtures__'
import { labwareImages } from '../labware-images'
import { Gallery } from '../Gallery'
import { fireEvent } from '@testing-library/react'

const render = (props: React.ComponentProps<typeof Gallery>) => {
  return renderWithProviders(<Gallery {...props} />)
}

describe('Gallery', () => {
  let props: React.ComponentProps<typeof Gallery>
  beforeEach(() => {
    labwareImages.mock_definition = ['image1']
    props = {
      definition: mockDefinition,
    }
  })

  it('renders one main SVG and no mini images if definition contains no images', () => {
    labwareImages.mock_definition = []
    const [{ getByTestId, queryAllByTestId }] = render(props)

    getByTestId('gallery_main_svg')
    expect(queryAllByTestId('gallery_mini_image')).toHaveLength(0)
  })

  it('renders one main SVG and two mini images if definition contains one image', () => {
    const [{ getByTestId, queryAllByTestId }] = render(props)

    getByTestId('gallery_main_svg')
    expect(queryAllByTestId('gallery_mini_image')).toHaveLength(2)
  })

  it('renders image in main image when mini image is clicked', () => {
    const [{ getAllByRole, queryAllByTestId }] = render(props)

    let images = getAllByRole('img')
    expect(images).toHaveLength(1)
    const miniImages = queryAllByTestId('gallery_mini_image')
    fireEvent.click(miniImages[1])
    images = getAllByRole('img')
    expect(images).toHaveLength(2)
  })
})
