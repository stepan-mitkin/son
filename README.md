# Son
A scenario-based programming language

## Description

**Son** is an experimental programming language designed as a subset of JavaScript. It simplifies programming by eliminating complex branching, allowing only linear algorithms. In Son, each procedure is represented as a set of *plots*, which are individual units of logic. A plot is a scenario that depicts one possible path through the algorithm. The language’s transpiler automatically combines these plos to build the full procedure.

One key advantage of Son is that scenarios are easy to test in isolation, making debugging and verification straightforward. Additionally, anyone with basic JavaScript knowledge can quickly start using Son, thanks to its familiar syntax and streamlined approach.

## Installation

```
npm install --global sonjs
```

## Examples

This file defines a function called `fizzbuzz` that takes a single argument, `number`. The function's name is derived from the filename.

**fizzbuzz.js**
```javascript
fun(number)

plot("divisible by 3 - Fizz")
yes(number % 3 === 0)
no(number % 5 === 0)
return "Fizz"


plot("divisible by 5 - Buzz")
no(number % 3 === 0)
yes(number % 5 === 0)
return "Buzz"

plot("divisible by 3 and 5 - FizzBuzz")
yes(number % 3 === 0)
yes(number % 5 === 0)
return "FizzBuzz"
```

A Son file can include optional shared code and may contain one or more plots. 

A plot includes rules and actions. Actions are written in plain JavaScript, while rules are defined using the functions `yes()` and `no()`.

At runtime, only one plot is executed.

A `return` or `throw` statement terminates the plot.

The matching rules for all plots must be mutually exclusive, meaning only the rules of one plot can be true at a time.

The order in which the matching rules are evaluated is important, so ensure they are arranged correctly. 

Additionally, the matching rules should contain pure functions, meaning they must not produce any side effects.

**fibonacci.js**
```javascript
fun(ordinal) 

yes(ordinal === 0)
return ordinal // return and throw end a plot

yes(ordinal === 1)
return ordinal

yes(ordinal === OTHER) // All other values besides 0 and 1
return fibonacci(ordinal - 2) + fibonacci(ordinal - 1)
```

## Usage


### A single function

Compile the `examples/myModule/fibonacci.js` function into JavaScript and save the generated `fibonacci.js` file in the `dist` folder. The `dist` folder must exist.

Be careful to not to overwrite the source file. Specify a different output folder since the output filename will be the same as the source filename.


```
sonjs --output dist examples/myModule/fibonacci.js
```

### One project

Read the Son project from the `examples/myModule/myModule.son` file and include all function, property, and plain JavaScript files from the `examples/myModule/` folder and its subfolders.
Write the generated `myModule.js` file to the `dist` folder in the CommonJS format. The `dist` folder must exist.

```
sonjs --output dist --commonjs examples/myModule/myModule.son
```


### Many projects in several subfolders

Find the .son module files located in the `examples/myModule` folder or its subfolders and compile the modules
into .js files. Write the .js files to the `dist` folder in the ECMAScript format. The `dist` folder must exist.

```
sonjs --output dist --es examples/myModule
```

## Code generation

The Son transpiler generates JavaScript code in multiple formats: browser, ES (ECMAScript), and CommonJS. 

The generated functions can either be grouped together in an object (similar to a class) or written individually in a procedural style.
