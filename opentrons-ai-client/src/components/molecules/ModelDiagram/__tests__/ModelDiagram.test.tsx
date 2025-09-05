import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ABSORBANCE_READER_TYPE,
  ABSORBANCE_READER_V1,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
} from '@opentrons/shared-data'

import { ModuleDiagram } from '../index'

import type { ComponentProps } from 'react'

vi.mock('../modeldiagram.module.css', () => ({
  default: {
    image: 'image',
    flex_stacker_image: 'flex_stacker_image',
  },
}))

describe('ModelDiagram', () => {
  let props: ComponentProps<typeof ModuleDiagram>

  beforeEach(() => {
    props = {
      type: FLEX_STACKER_MODULE_TYPE,
      model: FLEX_STACKER_MODULE_V1,
    }
  })

  it('should apply special styling for Flex Stacker module', () => {
    render(<ModuleDiagram {...props} />)
    const image = screen.getByRole('img')

    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('alt', FLEX_STACKER_MODULE_TYPE)
    expect(image).toHaveClass('flex_stacker_image')
    expect(image).not.toHaveClass('image')
  })

  it('should render Absorbance Plate Reader with standard styling', () => {
    props.type = ABSORBANCE_READER_TYPE
    props.model = ABSORBANCE_READER_V1

    render(<ModuleDiagram {...props} />)
    const image = screen.getByRole('img')

    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('alt', ABSORBANCE_READER_TYPE)
    expect(image).toHaveClass('image')
    expect(image).not.toHaveClass('flex_stacker_image')
  })
})
