export type RecoveryIntent = 'recovering' | 'canceling'

// The shape of the client data at the error recovery key.
export interface ClientDataRecovery {
  userId: string | null
  intent: RecoveryIntent | null
}
