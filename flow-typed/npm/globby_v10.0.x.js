// flow-typed signature: 2d78553e67c6713b7bb9ce69d73a6e33
// flow-typed version: <<STUB>>/globby_v10.0.1/flow_v0.102.0

declare module 'globby' {
  declare function globby(
    patterns: string | $ReadOnlyArray<string>
  ): Promise<Array<string>>

  declare module.exports: typeof globby
}
