export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tag = target.tagName
  // textarea, input, select are editable keyboard targets
  if (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    tag === 'BUTTON'
  ) {
    return true
  }

  return target.isContentEditable ?? false
}
