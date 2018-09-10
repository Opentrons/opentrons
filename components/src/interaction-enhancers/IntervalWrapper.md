Use `<IntervalWrapper>` to wrap a components that need to periodically refresh

```js
initialState = {count: 0}
;
<IntervalWrapper interval={2000} refresh={() => setState({count: state.count + 1})}>
  <div>{state.count}</div>
</IntervalWrapper>
```
