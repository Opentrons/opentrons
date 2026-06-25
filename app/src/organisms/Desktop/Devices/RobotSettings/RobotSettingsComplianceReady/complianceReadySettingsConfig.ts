import type { ComplianceReadySettingsSectionConfig } from './complianceReadySettingsTypes'

export const SETTINGS_SECTIONS: ComplianceReadySettingsSectionConfig[] = [
  {
    titleKey: 'desktop_login_and_security',
    fields: [
      {
        type: 'input',
        id: 'maxNumberOfLoginAttempts',
        labelKey: 'desktop_maximum_login_attempts_before_account_deactivation',
        unitsKey: 'desktop_logins',
      },
      {
        type: 'toggle',
        id: 'passwordResetEnabled',
        labelKey: 'desktop_require_password_change_after_time',
        children: [
          {
            type: 'input',
            id: 'passwordResetTime',
            labelKey: 'desktop_length_of_time',
            unitsKey: 'desktop_days',
          },
        ],
      },
      {
        type: 'toggle',
        id: 'passwordComplexityEnabled',
        labelKey: 'desktop_require_password_complexity_requirements',
        children: [
          {
            type: 'toggle',
            id: 'passwordComplexitySpecialCharacters',
            labelKey: 'desktop_require_special_characters',
          },
          {
            type: 'input',
            id: 'passwordComplexityMinimumLength',
            labelKey: 'desktop_minimum_password_length',
            unitsKey: 'desktop_characters',
          },
        ],
      },
      {
        type: 'input',
        id: 'idleLogout',
        labelKey: 'desktop_auto_logout_inactivity_length',
        unitsKey: 'desktop_minutes',
      },
    ],
  },
  {
    titleKey: 'desktop_actions_requiring_admin_credentials',
    fields: [
      {
        type: 'toggle',
        id: 'requireAdminCredsWhenUpdatingRobotSoftware',
        labelKey: 'desktop_require_admin_credentials_to_update_robots',
      },
      {
        type: 'toggle',
        id: 'requireAdminCredsWhenSendingProtocolToRobot',
        labelKey: 'desktop_require_admin_credentials_to_send_protocols',
      },
      {
        type: 'toggle',
        id: 'requireAdminCredsForSignoffProtocol',
        labelKey:
          'desktop_require_admin_credentials_to_sign_protocol_run_records',
      },
    ],
  },
  {
    titleKey: 'desktop_protocol_logs',
    fields: [
      {
        type: 'toggle',
        id: 'requireSignoffForProtocolLog',
        labelKey: 'desktop_require_signoff_for_protocol_log',
      },
      // TODO(tz, 2026-06-22): i dont see it in the design, but it is in the api
      // {
      //   type: 'toggle',
      //   id: 'requireLogsToBeSavedInApp',
      //   labelKey: 'desktop_require_logs_saved_in_app',
      // },
      {
        type: 'toggle',
        id: 'deleteOverMaxOnDiskProtocols',
        labelKey: 'desktop_automatically_delete_protocol_run_logs',
      },
    ],
  },
  {
    titleKey: 'desktop_audit_log_requirements',
    fields: [
      {
        type: 'toggle',
        id: 'requireReasonForInteraction',
        labelKey: 'desktop_require_documentation_for_robot_actions',
        children: [
          {
            type: 'input',
            id: 'minLengthOfReasonForInteraction',
            labelKey:
              'desktop_minimum_length_for_documentation_for_robot_actions',
            unitsKey: 'desktop_characters',
          },
        ],
      },
    ],
  },
]
