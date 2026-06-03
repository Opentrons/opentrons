import type { LoginStep } from '../index'

interface UseLoginFieldErrorParams {
  step: LoginStep
  loginError: string | null
  confirmPasswordError: string | null
}

export function useLoginFieldError({
  step,
  loginError,
  confirmPasswordError,
}: UseLoginFieldErrorParams): string | null {
  const passwordLabelHasError =
    step === 'password' && loginError != null && loginError !== ''

  return step === 'confirmPassword'
    ? confirmPasswordError
    : passwordLabelHasError
      ? loginError
      : null
}
