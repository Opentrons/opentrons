`ClickOutside` wraps a component in a `wrapperElement` (defaults to `div`),
and will call the `onClickOutside` callback whenever a user clicks outside
of the `ClickOutside` wrapper.

`wrapperElement` as a `span`:

```js
initialState = {counter: 0};

<ClickOutside wrapperElement='span' onClickOutside={() => setState({counter: state.counter + 1})}>
  <p>Click outside of this!</p>
  <strong>Outside click count is {state.counter}</strong>
  <p>Clicking anywhere inside here does not increment the counter</p>
</ClickOutside>
```


`wrapperElement` as a `g` inside an `svg` (clicking in the gray doesn't increment the counter, clicking in the black or anywhere else in the page will increment it):

```js
initialState = {counter: 0};

<svg width='500' height='200'>
  <ClickOutside wrapperElement='g' onClickOutside={() => setState({counter: state.counter + 1})}>
    <rect width='500' height='100' style={{fill: 'gray'}} />
    <text x='25' y='50' style={{fill: 'yellow'}}>Outside click count is {state.counter}</text>
  </ClickOutside>
  <rect width='500' height='100' y='100' style={{fill: 'black'}}/>
  <text x='25' y='150' style={{fill: 'orange'}}>This is in the same SVG, but not in the ClickOutside 'g'</text>
</svg>
```
