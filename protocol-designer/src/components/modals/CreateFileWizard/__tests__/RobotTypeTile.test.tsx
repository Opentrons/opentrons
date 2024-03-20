import * as React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen, cleanup } from '@testing-library/react'
import { COLORS } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../localization'
import { RobotTypeTile } from '../RobotTypeTile'
import type { FormState, WizardTileProps } from '../types'

const render = (props: React.ComponentProps<typeof RobotTypeTile>) => {
  return renderWithProviders(<RobotTypeTile {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const values = {
  fields: {
    name: 'mockName',
    description: 'mockDescription',
    organizationOrAuthor: 'mockOrganizationOrAuthor',
    robotType: FLEX_ROBOT_TYPE,
  },
} as FormState

const mockWizardTileProps: Partial<WizardTileProps> = {
  proceed: vi.fn(),
  setValue: vi.fn(),
  //  @ts-expect-error: ts can't tell that its a nested key
  //  in values
  watch: vi.fn(() => values['fields.robotType']),
}

describe('RobotTypeTile', () => {
  let props: React.ComponentProps<typeof RobotTypeTile>

  beforeEach(() => {
    props = {
      ...props,
      ...mockWizardTileProps,
    } as WizardTileProps
  })
  afterEach(() => {
    cleanup()
  })

  it('renders robot images and clicking on them changing the style', () => {
    render(props)
    screen.getByLabelText('Opentrons Flex image')
    screen.getByLabelText('Opentrons OT-2 image')
    const flex = screen.getByLabelText('Opentrons Flex option')
    fireEvent.click(flex)
    expect(props.setValue).toHaveBeenCalled()
    expect(flex).toHaveStyle(`background-color: ${COLORS.white}`)
    const ot2 = screen.getByLabelText('Opentrons OT-2 option')
    fireEvent.click(ot2)
    expect(props.setValue).toHaveBeenCalled()
    expect(ot2).toHaveStyle(`background-color: ${COLORS.blue10}`)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(props.proceed).toHaveBeenCalled()
  })
})
