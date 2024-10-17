fun(array, begin, end, compare)

length = end - begin
last = end - 1

section("One or zero elements")

plot()
yes(length === 0 || length === 1)
return


section("Two elements")

plot()
yes(length === 2)
yes(compare(array, begin, last) <= 0)
return


plot()
yes(length === 2)
no(compare(array, begin, last) <= 0)
swap(array, begin, last)
return


section("The actual quicksort algorithm")

// Partition
pivotIndex = begin + Math.floor(length / 2)
swap(array, pivotIndex, last)
storeIndex = begin
loop(begin, last, i => {
    storeIndex = compareWithLastAndSwap(array, i, last, storeIndex, compare)
})
swap(array, storeIndex, last)

// Recurse
quickSort(array, begin, storeIndex, compare)
quickSort(array, storeIndex + 1, end, compare)

