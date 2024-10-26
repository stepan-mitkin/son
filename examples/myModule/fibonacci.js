fun(ordinal) 

yes(ordinal === 0)
return ordinal

yes(ordinal === 1)
return ordinal

yes(ordinal === OTHER) // All other values besides 0 and 1
return fibonacci(ordinal - 2) + fibonacci(ordinal - 1)
