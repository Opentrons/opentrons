Use `<IntervalWrapper>` to wrap a components that need to periodically refresh

```js
const [state, setState] = React.useState({ count: 0 })
;<IntervalWrapper
  interval={2000}
  refresh={() => setState({ count: state.count + 1 })}
>
  <div>{state.count}</div>
</IntervalWrapper>
```
