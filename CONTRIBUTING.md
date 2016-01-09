# To Do

- [ ] Write Contributing Guide
- [ ] Write Style Guide

## Style Guide

A style guide helps to ensure that the code everyone produces is consistent. BitCannon follows the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) with some minor differences described below:

### [Functions 7.1](https://github.com/airbnb/javascript#7.1)

This prohibits the use of function expressions. BitCannon allows function expressions on the basis that if a function should not change it should be a constant function expression, which means it will **not** change should someone attempt to override it. For example:

```
// bad - myFunc is overridden
function myFunc () {
  console.log('Hello, World!');
}

myFunc = function () {
  console.log('World, Hello!');
}

myFunc(); // 'World, Hello!'

// good - myFunc is not overridden
const myFunc = function () {
  console.log('Hello, World!');
}

myFunc = function () {
  console.log('World, Hello!');
}

myFunc(); // 'Hello, World!'
```

### Constants

Constants should be used whenever a value should not change. Constants should always be written in uppercase unless the constant is a function or an object that contains functions. For example:

```
// Bad
var abc = 'This does not change';

// Good

const ABC = 'This does not change';

// Bad

var myFunc = function () {
  console.log('Hello, World!');
}

// Good

const myFunc = function () {
  console.log('Hello, World!');
}

// Bad

var myStruct = {
  hello: 'world';
}

// Good

const MY_STRUCT = {
  hello: 'world';
}
```
