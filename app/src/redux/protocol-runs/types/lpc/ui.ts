export type LPCSnackbarType =
  'defaultAdded' | 'defaultAdjusted' | 'locationSpecificAdjusted' | null

export interface LPCUiState {
  showDefaultOffsetInfoBanner: boolean
  showSnackbar: LPCSnackbarType
}
