import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { getRobotType } from '/protocol-designer/file-data/selectors'

import { CameraTools } from '..'

import type { ComponentProps } from 'react'

vi.mock('/protocol-designer/file-data/selectors')
vi.mock('/protocol-designer/components/molecules/TextAreaField/index', () => {
  return {
    TextAreaField: vi.fn(() => <div>mock TextAreaField</div>),
  }
})

const render = (props: ComponentProps<typeof CameraTools>) => {
  return renderWithProviders(<CameraTools />, {
    i18nInstance: i18n,
  })
}

describe('CameraTools', () => {
  let props: ComponentProps<typeof CameraTools>

  beforeEach(() => {
    props = {
      propsForFields: {
        message: {
          disabled: false,
          errorToShow: null,
          name: 'message',
          value: null,
          tooltipContent: 'step_fields.defaults.message',
        },
      },
    } as any
  })

  it('renders text and text area field when it is FLEX robot', () => {
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
    render(props)
    screen.getByText('Camera')
    screen.getByText('Flex Camera')
  })
  it('renders text and text area field when it is an OT-2 robot', () => {
    vi.mocked(getRobotType).mockReturnValue(OT2_ROBOT_TYPE)
    render(props)
    screen.getByText('Camera')
    screen.getByText('OT-2 Camera')
  })
})
