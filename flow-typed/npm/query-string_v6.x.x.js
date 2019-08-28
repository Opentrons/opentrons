// flow-typed signature: dbf37e71299044169ddb7eb639c53be3
// flow-typed version: c6154227d1/query-string_v6.x.x/flow_>=v0.104.x

declare module 'query-string' {
  declare type ArrayFormat = 'none' | 'bracket' | 'index'
  declare type ParseOptions = {|
    arrayFormat?: ArrayFormat,
  |}

  declare type StringifyOptions = {|
    arrayFormat?: ArrayFormat,
    encode?: boolean,
    strict?: boolean,
    sort?: false | <A, B>(A, B) => number,
  |}

  declare type ObjectParameter = string | number | boolean | null | void;

  declare type ObjectParameters = $ReadOnly<{ [string]: ObjectParameter | $ReadOnlyArray<ObjectParameter>, ... }>

    // TODO(mc, 2019-03-28): return type can also be Array<string> if
  //   options.arrayFormat is set. We don't use this option, so I've removed
  //   the array type for simplicity
  declare type QueryParameters = {
    [string]: string | null | void,
    ...
  }

  declare module.exports: {
    extract(str: string): string,
    parse(str: string, opts?: ParseOptions): QueryParameters,
    parseUrl(str: string, opts?: ParseOptions): {
      url: string,
      query: QueryParameters,
      ...
    },
    stringify(obj: ObjectParameters, opts?: StringifyOptions): string,
    ...
  }
}
