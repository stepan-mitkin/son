# Son
A scenario-based programming language

## Description

**Son** is an experimental programming language designed as a subset of JavaScript. It simplifies programming by eliminating complex constructs like branching and loops, allowing only linear algorithms. In Son, each procedure is represented as a set of *plos*, which are individual units of logic. A plot is a scenario that depicts one possible path through the algorithm. The language’s transpiler automatically combines these plos to build the full procedure.

One key advantage of Son is that scenarios are easy to test in isolation, making debugging and verification straightforward. Additionally, anyone with basic JavaScript knowledge can quickly start using Son, thanks to its familiar syntax and streamlined approach.

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

The matching rules for all plots within a section must be mutually exclusive, meaning only one rule can be true at a time.

The order in which the matching rules are evaluated is important, so ensure they are arranged correctly. 

Additionally, the matching rules should contain pure functions, meaning they must not produce any side effects.

**fibonacci.js**
```javascript
fun(ordinal) 

section("The first two elements")
plot()
yes(ordinal <= 1)
return ordinal

section("The main algorithm")
return fibonacci(ordinal - 2) + fibonacci(ordinal - 1)
```

## Code generation

The Son transpiler generates JavaScript code in multiple formats: browser, ES (ECMAScript), and CommonJS. 

The generated functions can either be grouped together in an object (similar to a class) or written individually in a procedural style.
