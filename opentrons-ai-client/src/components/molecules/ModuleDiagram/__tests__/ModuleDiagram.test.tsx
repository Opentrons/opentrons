import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  ABSORBANCE_READER_TYPE,
  ABSORBANCE_READER_V1,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/ai-client/__testing-utils__'

import { ModuleDiagram } from '../index'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof ModuleDiagram>) => {
  const { type, model } = props
  return renderWithProviders(<ModuleDiagram type={type} model={model} />)
}

describe('ModelDiagram', () => {
  let props: ComponentProps<typeof ModuleDiagram>

  beforeEach(() => {
    props = {
      type: FLEX_STACKER_MODULE_TYPE,
      model: FLEX_STACKER_MODULE_V1,
    }
  })

  it('should render Flex Stacker module with correct image and alt text', () => {
    render(props)
    const image = screen.getByRole('img')

    expect(image.getAttribute('src')).toContain('flex_stacker')
    expect(image).toHaveAttribute('alt', FLEX_STACKER_MODULE_TYPE)
  })

  it('should render Absorbance Plate Reader with correct image and alt text', () => {
    props.type = ABSORBANCE_READER_TYPE
    props.model = ABSORBANCE_READER_V1

    render(props)
    const image = screen.getByRole('img')

    expect(image.getAttribute('src')).toContain('flex_plate_reader')
    expect(image).toHaveAttribute('alt', ABSORBANCE_READER_TYPE)
  })
})
