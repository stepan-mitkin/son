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
