// flow-typed signature: 75a00bfb6d88f0eeab26b7cf7ea7f237
// flow-typed version: <<STUB>>/to-regex_v3.0.2/flow_v0.76.0

declare module 'to-regex' {
  declare module.exports: (
    patterns: string | RegExp | Array<string | RegExp>,
    options: {
      contains?: boolean,
      negate?: boolean,
      nocase?: boolean,
      flags?: string,
      cache?: boolean,
      safe?: boolean,
    }
  ) => RegExp;
};
