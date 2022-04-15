import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { PipetteOverflowMenu } from '../pipetteOverflowMenu'
import { mockLeftProtoPipette } from '../../../../redux/pipettes/__fixtures__'

import type { Mount } from '../../../../redux/pipettes/types'

const render = (props: React.ComponentProps<typeof PipetteOverflowMenu>) => {
  return renderWithProviders(<PipetteOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const LEFT = 'left' as Mount
describe('PipetteOverflowMenu', () => {
  let props: React.ComponentProps<typeof PipetteOverflowMenu>

  beforeEach(() => {
    props = {
      pipetteName: mockLeftProtoPipette.displayName,
      mount: LEFT,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  //    TODO(jr, 4/15/22): add to test when buttons are wired up
  it('renders information with a pipette attached', () => {
    const { getByRole } = render(props)
    getByRole('button', { name: 'Calibrate pipette offset' })
    getByRole('button', { name: 'Detach pipette' })
    getByRole('button', { name: 'View pipette settings' })
  })
  it('renders information with no pipette attached', () => {
    props = {
      pipetteName: 'Empty',
      mount: LEFT,
    }
    const { getByRole } = render(props)
    getByRole('button', { name: 'Attach pipette' })
  })
})
