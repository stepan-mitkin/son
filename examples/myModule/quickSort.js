fun(array, begin, end, cmp)

length = end - begin
last = end - 1

yes(length === 0)
return

yes(length === 1)
return


yes(length === 2)
yes(compare(array, begin, last, cmp) <= 0)
return

yes(length === 2)
no(compare(array, begin, last, cmp) <= 0)
swap(array, begin, last)
return

yes(length === OTHER)
// Partition
pivotIndex = begin + Math.floor(length / 2)
swap(array, pivotIndex, last)
storeIndex = begin
loop(begin, last, i => {
    storeIndex = compareWithLastAndSwap(array, i, last, storeIndex, cmp)
})
swap(array, storeIndex, last)

// Recurse
quickSort(array, begin, storeIndex, cmp)
quickSort(array, storeIndex + 1, end, cmp)

