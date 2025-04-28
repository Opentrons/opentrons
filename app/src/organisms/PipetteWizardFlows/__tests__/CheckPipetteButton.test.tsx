import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '/app/__testing-utils__'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CheckPipetteButton } from '../CheckPipetteButton'

const render = (props: ComponentProps<typeof CheckPipetteButton>) => {
  return renderWithProviders(<CheckPipetteButton {...props} />)[0]
}

vi.mock('@opentrons/react-api-client')

describe('CheckPipetteButton', () => {
  let props: ComponentProps<typeof CheckPipetteButton>
  const refetch = vi.fn(() => Promise.resolve())
  beforeEach(() => {
    props = {
      proceed: vi.fn(),
      proceedButtonText: 'continue',
      setFetching: vi.fn(),
      isOnDevice: false,
      isFetching: false,
    }
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      refetch,
    } as any)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('clicking on the button calls refetch and proceed', async () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'continue' }))
    expect(refetch).toHaveBeenCalled()
    await waitFor(() => expect(props.proceed).toHaveBeenCalled())
  })
  it('button is disabled when fetching is true', () => {
    render({ ...props, isFetching: true })
    expect(screen.getByRole('button', { name: 'continue' })).toBeDisabled()
  })
})
