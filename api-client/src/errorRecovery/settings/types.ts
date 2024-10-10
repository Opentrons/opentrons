export interface ErrorRecoverySettingsResponse {
  data: {
    enabled: boolean
  }
}

export interface ErrorRecoverySettingsRequest {
  data: Partial<ErrorRecoverySettingsResponse['data']>
}
