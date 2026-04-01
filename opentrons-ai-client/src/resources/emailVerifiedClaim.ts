/**
 * Namespace used in the Auth0 Post-Login Action for the email_verified claim.
 * Must match the Action: api.idToken.setCustomClaim(`${namespace}/email_verified`, ...)
 */
const EMAIL_VERIFIED_NAMESPACE = 'https://opentrons.com'

/** ID token claim key for email_verified (namespaced; matches Auth0 Action). */
export function getEmailVerifiedClaimKey(): string {
  return `${EMAIL_VERIFIED_NAMESPACE}/email_verified`
}

/**
 * Returns true only when the namespaced email_verified claim is strictly true.
 * Treats missing, undefined, or false as unverified.
 */
export function isEmailVerifiedFromClaims(
  claims: Record<string, unknown> | null | undefined
): boolean {
  if (claims == null) return false
  const value = claims[getEmailVerifiedClaimKey()]
  return value === true
}

/**
 * Returns true only when the user object has the namespaced email_verified claim set to true.
 * The Auth0 React SDK includes ID token custom claims on the user object.
 */
export function isEmailVerifiedFromUser(
  user: Record<string, unknown> | null | undefined
): boolean {
  if (user == null) return false
  const value = user[getEmailVerifiedClaimKey()]
  return value === true
}
