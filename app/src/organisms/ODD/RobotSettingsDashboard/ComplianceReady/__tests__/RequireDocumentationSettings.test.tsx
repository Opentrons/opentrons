import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { RequireDocumentationSettings } from '../RequireDocumentationSettings'

import type { ComponentProps } from 'react'
import type { AuditSettingsData } from '@opentrons/api-client'

vi.mock('/app/atoms/SoftwareKeyboard/NumericalKeyboard', () => ({
  NumericalKeyboard: () => <div>mock numerical keyboard</div>,
}))

const MOCK_AUDIT_SETTINGS: AuditSettingsData = {
  requireReasonForInteraction: true,
  minLengthOfReasonForInteraction: 8,
}

const render = (
  props: ComponentProps<typeof RequireDocumentationSettings>
): void => {
  renderWithProviders(<RequireDocumentationSettings {...props} />, {
    i18nInstance: i18n,
  })
}

describe('RequireDocumentationSettings', () => {
  let props: ComponentProps<typeof RequireDocumentationSettings>

  beforeEach(() => {
    props = {
      auditSettings: MOCK_AUDIT_SETTINGS,
      onClickBack: vi.fn(),
      patchAuditSettings: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders documentation preferences when enabled', () => {
    render(props)

    expect(
      screen.getAllByText('Require documentation for robot actions')
    ).toHaveLength(2)
    screen.getByText('Preferences')
    screen.getByText('Minimum length for documentation for robot actions')
    screen.getByText('8 chars')
  })

  it('hides preferences when documentation is disabled', () => {
    props.auditSettings = {
      requireReasonForInteraction: false,
      minLengthOfReasonForInteraction: 8,
    }
    render(props)

    expect(screen.queryByText('Preferences')).not.toBeInTheDocument()
  })

  it('enables documentation on click', () => {
    props.auditSettings = {
      requireReasonForInteraction: false,
      minLengthOfReasonForInteraction: null,
    }
    render(props)

    fireEvent.click(
      screen.getAllByText('Require documentation for robot actions')[1]
    )
    expect(props.patchAuditSettings).toHaveBeenCalledWith({
      requireReasonForInteraction: true,
    })
  })

  it('disables documentation on click', () => {
    render(props)

    fireEvent.click(
      screen.getAllByText('Require documentation for robot actions')[1]
    )
    expect(props.patchAuditSettings).toHaveBeenCalledWith({
      requireReasonForInteraction: false,
    })
  })

  it('opens minimum length and patches the entered value', () => {
    render(props)

    fireEvent.click(
      screen.getByText('Minimum length for documentation for robot actions')
    )
    screen.getByText('Minimum length for documentation')

    fireEvent.change(screen.getByLabelText('Number of characters'), {
      target: { value: '16' },
    })
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))

    expect(props.patchAuditSettings).toHaveBeenCalledWith({
      minLengthOfReasonForInteraction: 16,
    })
    screen.getByText('Preferences')
  })

  it('calls onClickBack from the main page', () => {
    render(props)

    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(props.onClickBack).toHaveBeenCalled()
  })

  it('treats missing documentation keys as off and enables the requirement', () => {
    props.auditSettings = {}
    render(props)

    expect(screen.queryByText('Preferences')).not.toBeInTheDocument()

    fireEvent.click(
      screen.getAllByText('Require documentation for robot actions')[1]
    )
    expect(props.patchAuditSettings).toHaveBeenCalledWith({
      requireReasonForInteraction: true,
    })
  })
})
