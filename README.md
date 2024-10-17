# Son
A scenario-based programming language

## Description

**Son** is an experimental programming language designed as a subset of JavaScript. It simplifies programming by eliminating complex constructs like branching and loops, allowing only linear algorithms. In Son, each procedure is represented as a set of *scenarios*, which are individual units of logic. The language’s transpiler automatically combines these scenarios to build the full procedure.

One key advantage of Son is that scenarios are easy to test in isolation, making debugging and verification straightforward. Additionally, anyone with basic JavaScript knowledge can quickly start using Son, thanks to its familiar syntax and streamlined approach.

## Examples

**fizzbuzz.js**
```javascript
fun(number)  // This file describes a function 
                        // that takes one argument - number.
                        // The name of the function - fizzbuzz - is taken from the filename.

section()  // A function must have at least one section.
                // At most one scenario within a section
                // will be actually executed
                // based on the matching rules.

function divisibleByThree_Fizz() { // Note that the scenario names resemble unit-test names.
    yes(number % 3 === 0) // Matching rule 1. The number must be divisible by 3.
    no(number % 5 === 0)  // Matching rule 2. AND the number must NOT be divisible by 5.
    return "Fizz" // Exit the algorithm, return the result.
                  // Do not process other scenarios and sections that follow below.
}

function divisibleByFive_Fizz() {
    no(number % 3 === 0)  // The number must NOT be divisible by 3.
                          // The matching rules of all scenarios within one section
                          // must be mutually exclusive.
                          // The order of the matching rules is important.
                          // Make sure that the matching rules are
                          // pure functions with no side-effects.
    yes(number % 5 === 0) // AND the number must be divisible by 5.
    return "Buzz"
}

function divisibleByThreeAndFive_FizzBuzz() {
    yes(number % 3 === 0) // The number must be divisible by 3.
    yes(number % 5 === 0) // AND the number must be divisible by 5.
    return "FizzBuzz"
}
```

**fibonacci.js**
```javascript
fun(ordinal) // This file describes a function 
                        // that takes one argument - ordinal.
                        // The name of the function - fibonacci - is taken from the filename.

section("The first two elements")

function theFirstTwoElements_ReturnOrdinal() {
    yes(ordinal <= 1) // Apply this scenario is when ordinal <= 1.
    return ordinal // "return" exits the algorithm
                   // preventing the evaluation of other scenarios
                   // and sections that follow below.
}

section("The main algorithm")

function recurse() {
    return fibonacci(ordinal - 2) + fibonacci(ordinal - 1)
}
```
