defineFunction(ordinal) // This file describes a function 
                        // that takes one argument - ordinal.
                        // The name of the function - fibonacci - is taken from the filename.

startSection("The first two elements")

function theFirstTwoElements_ReturnOrdinal() {
    yes(ordinal <= 1) // Apply this scenario is when ordinal <= 1.
    return ordinal // "return" exits the algorithm
                   // preventing the evaluation of other scenarios
                   // that follow below.
}

startSection("The main algorithm")

function recurse() {
    return fibonacci(ordinal - 2) + fibonacci(ordinal - 1)
}