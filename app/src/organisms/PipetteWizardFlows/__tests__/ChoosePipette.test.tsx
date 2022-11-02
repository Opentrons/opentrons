import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { COLORS, renderWithProviders } from '@opentrons/components'
import { LEFT } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { FLOWS } from '../constants'
import { ChoosePipette } from '../ChoosePipette'

const render = (props: React.ComponentProps<typeof ChoosePipette>) => {
  return renderWithProviders(<ChoosePipette {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ChoosePipette', () => {
  let props: React.ComponentProps<typeof ChoosePipette>
  beforeEach(() => {
    props = {
      mount: LEFT,
      goBack: jest.fn(),
      proceed: jest.fn(),
      flowType: FLOWS.ATTACH,
    }
  })
  it('returns the correct information, buttons work as expected', () => {
    const { getByText, getByAltText, getByRole, getByTestId } = render(props)
    getByText('Choose a pipette to attach')
    getByText('Single or 8-Channel pipette')
    getByText('96-Channel pipette')
    getByAltText('Single or 8-Channel pipette')
    getByAltText('96-Channel pipette')
    const singleMountPipettes = getByTestId('ChoosePipette_SingleAndEight')
    const ninetySixPipette = getByTestId('ChoosePipette_NinetySix')

    //  Single and 8-Channel pipettes are selected first by default
    expect(singleMountPipettes).toHaveStyle(
      `background-color: ${COLORS.lightBlue}`
    )
    expect(ninetySixPipette).toHaveStyle(`background-color: ${COLORS.white}`)

    //  Selecting 96-Channel changes the style
    fireEvent.click(ninetySixPipette)
    expect(singleMountPipettes).toHaveStyle(`background-color: ${COLORS.white}`)
    expect(ninetySixPipette).toHaveStyle(
      `background-color: ${COLORS.lightBlue}`
    )

    //  Selecting Single and 8-Channel pipettes changes the style
    fireEvent.click(singleMountPipettes)
    expect(singleMountPipettes).toHaveStyle(
      `background-color: ${COLORS.lightBlue}`
    )
    expect(ninetySixPipette).toHaveStyle(`background-color: ${COLORS.white}`)

    const proceedBtn = getByRole('button', { name: 'Attach this pipette' })
    fireEvent.click(proceedBtn)
    expect(props.proceed).toHaveBeenCalled()
  })
})
