fun(array, begin, end, compare)

length = end - begin
last = end - 1

startSection("One or zero elements")

function oneElementOrEmtpy_NothingToDo() {
    yes(length === 0 || length === 1)
    return
}

startSection("Two elements")

function twoElements_goodOrder_return() {
    yes(length === 2)
    yes(compare(array, begin, last) <= 0)
    return
}

function twoElements_reverseOrder_swap() {
    yes(length === 2)
    no(compare(array, begin, last) <= 0)
    swap(array, begin, last)
    return
}

startSection("The actual quicksort algorithm")

function partitionAndRecurse() {
    // Partition
    pivotIndex = begin + length / 2
    swap(array, pivotIndex, last)
    storeIndex = begin
    loop(array, begin, last, 1, i => {
        storeIndex = compareWithLastAndSwap(array, i, last, storeIndex)
    })
    swap(array, storeIndex, last)

    // Recurse
    quickSort(array, begin, storeIndex, compare)
    quickSort(array, storeIndex + 1, end, compare)
}
