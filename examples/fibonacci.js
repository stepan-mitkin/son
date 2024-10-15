fun(ordinal) 

startSection("The first two elements")

function returnOrdinal() {
    yes(ordinal <= 1)
    return ordinal
}

startSection("The main algorithm")

function recurse() {
    return fibonacci(ordinal - 2) + fibonacci(ordinal - 1)
}