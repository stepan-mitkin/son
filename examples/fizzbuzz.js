defineFunction(number)  // This file describes a function 
                        // that takes one argument - number.
                        // The name of the function - fizzbuzz - is taken from the filename.

startSection()  // A function must have at least one section.
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
