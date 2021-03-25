// TODO(IL, 2021-03-24): update query-string module so that it has its own type defs?
// @types/query-string is deprecated.

declare module 'query-string' {
  const queryString: any
  // eslint-disable-next-line import/no-default-export
  export default queryString
}
