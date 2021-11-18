import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { Timer } from '../Timer'

const START_TIME = '2021-10-07T18:44:49.366581+00:00'
const PAUSED_TIME = '2021-10-07T18:47:55.366581+00:00'
const COMPLETED_TIME = '2021-10-07T18:58:59.366581+00:00'

const render = () => {
  return renderWithProviders(
    <Timer startTime={START_TIME} pausedAt={null} completedAt={null} />,
    {
      i18nInstance: i18n,
    }
  )
}

const renderPaused = () => {
  return renderWithProviders(
    <Timer startTime={START_TIME} pausedAt={PAUSED_TIME} completedAt={null} />,
    {
      i18nInstance: i18n,
    }
  )
}

const renderCompleted = () => {
  return renderWithProviders(
    <Timer
      startTime={START_TIME}
      pausedAt={null}
      completedAt={COMPLETED_TIME}
    />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('Timer', () => {
  it('renders a start time', () => {
    const [{ getByText }] = render()

    expect(
      getByText(
        /^Start Time: (\d{1,2}):(\d{2}):(\d{2}) (A|P)M GMT(\+|-)(\d{2}):(\d{2})$/
      )
    ).toBeTruthy()
  })

  it('renders a run time', () => {
    const [{ getByText }] = render()

    expect(getByText('Run Time:')).toBeTruthy()
    expect(getByText(/^(\d{2,}):(\d{2}):(\d{2})$/)).toBeTruthy()
  })

  it('renders a paused time and a run time when paused', () => {
    const [{ getAllByText, getByText }] = renderPaused()

    expect(getByText('Run Time:')).toBeTruthy()
    expect(getByText('Paused For:')).toBeTruthy()
    expect(getAllByText(/^(\d{2,}):(\d{2}):(\d{2})$/).length).toEqual(2)
  })

  it('renders a completed time when completed', async () => {
    const [{ getByText }] = renderCompleted()

    expect(getByText('Run Time:')).toBeTruthy()
    expect(getByText('00:14:10')).toBeTruthy()
  })
})
