`clickOutside` is a HOC adds an `onClickOutside` props to a component that will be called whenever a user clicks outside that component.

This won't work with just any component. The component must implement a prop `passRef` which `clickOutside` can use to get the `ref` of the outermost DOM element.

A minimal example: `function MyComponent (passRef) {return <div ref={props.passRef} />}`

`clickOutside` exposes the type `ClickOutsideInterface` that can be union-typed with your component's Props type to make sure it exposes `passRef`.

```js
// See ExampleClickOutside.js for the code!
<ExampleClickOutside />
```
