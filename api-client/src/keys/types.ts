export interface CACertPassword {
  data: {
    password: string
    valid_from_utc: string
    valid_until_utc: string
  }
}

export interface EncryptedCertificate {
  cert_data: string
  key_salt: string
  key_expires_at: string
  kdf_iterations: number
}

export interface OldAndNewEncryptedCertificate {
  current: EncryptedCertificate
  previous?: EncryptedCertificate | null
}

export interface EncryptedCACertificates {
  data: {
    current: OldAndNewEncryptedCertificate
    next?: OldAndNewEncryptedCertificate | null
  }
}

export interface UnencryptedCert {
  cert_data: string
}

export interface PlaintextCACertificates {
  data: {
    current: UnencryptedCert
    next?: UnencryptedCert | null
  }
}
