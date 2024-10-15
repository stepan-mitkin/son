fun(number)

function divisibleByThree_Fizz() {
    yes(number % 3 === 0)
    no(number % 5 === 0)
    return "Fizz"
}

function divisibleByFive_Fizz() {
    no(number % 3 === 0)
    yes(number % 5 === 0)
    return "Buzz"
}

function divisibleByThreeAndFive_FizzBuzz() {
    yes(number % 3 === 0)
    yes(number % 5 === 0)
    return "FizzBuzz"
}
