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

A Son file consists of one or more sections. Each section can include optional shared code and may contain one or more plots. 
The **fizzbuzz.js** file contains only one, default section.

A plot can include both rules and actions. Actions are written in plain JavaScript, while rules are defined using the functions `yes()` and `no()`.

At runtime, only one plot from each section is executed.

A `return` or `throw` statement terminates the function. In such a case, all remaining sections are skipped.

The matching rules for all plots within a section must be mutually exclusive, meaning only the rules of one plot can be true at a time.

The order in which the matching rules are evaluated is important, so ensure they are arranged correctly. 

Additionally, the matching rules should contain pure functions, meaning they must not produce any side effects.

**fibonacci.js**
```javascript
fun(ordinal) 

section("The first two elements")
// A plot starts implicitly with keywords yes/no
yes(ordinal <= 1)
return ordinal

section("The main algorithm")
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
