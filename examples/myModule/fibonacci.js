fun(ordinal) 

section("The first two elements")
plot()
yes(ordinal <= 1)
return ordinal

section("The main algorithm")
return fibonacci(ordinal - 2) + fibonacci(ordinal - 1)
