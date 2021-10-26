import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { LabwarePositionCheckStepDetailModal } from '../LabwarePositionCheckStepDetailModal'

const render = (
  props: React.ComponentProps<typeof LabwarePositionCheckStepDetailModal>
) => {
  return renderWithProviders(
    <LabwarePositionCheckStepDetailModal {...props} />,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('LabwarePositionCheckStepDetailModal', () => {
  let props: React.ComponentProps<typeof LabwarePositionCheckStepDetailModal>
  beforeEach(() => {
    props = { onCloseClick: jest.fn() }
  })

  it('should render the correct header', () => {
    const { getByRole } = render(props)
    expect(
      getByRole('heading', {
        name: 'How to tell if the pipette is centered and level',
      })
    ).toBeTruthy()
  })
  it('should render the correct body and image texts', () => {
    const { getByText } = render(props)
    getByText(
      'To ensure that the nozzle is centered, check from a second side of your OT-2.'
    )
    getByText(
      'To ensure the nozzle or tip is level with the top of the labware, position yourself at eye-level and/or slide a sheet of paper between the nozzle and tip.'
    )
    getByText('Viewed from front, it appears centered...')
    getByText('...but viewed from side, it requires adjustment')
    getByText('Nozzle is not centered')
    getByText('Viewed from standing height, it appears level...')
    getByText('... but viewed from eye-level, it requires adjustment')
    getByText('Nozzle is not level')
    getByText(
      'If you’re having trouble, slide 1 sheet of printer paper between the nozzle and the tip. A single piece of paper should barely pass between them.'
    )
  })
  it('should call onCloseClick when the close button is pressed', () => {
    const { getByRole } = render(props)
    expect(props.onCloseClick).not.toHaveBeenCalled()
    const closeButton = getByRole('button', { name: 'close' })
    fireEvent.click(closeButton)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
