export const capitalizeFirstLetterAfterNumber = (title: string): string =>
  title.replace(
    /(^[\d\W]*)([a-zA-Z])/,
    (match, prefix, firstLetter) => `${prefix}${firstLetter.toUpperCase()}`
  )
