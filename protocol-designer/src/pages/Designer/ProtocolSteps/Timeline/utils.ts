export function capitalizeFirstLetterAfterNumber(title: string): string {
  return title.replace(
    /(^[\d\W]*)([a-zA-Z])/,
    (match, prefix, firstLetter) => `${prefix}${firstLetter.toUpperCase()}`
  )
}
