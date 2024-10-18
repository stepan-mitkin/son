
function swap(array, one, two) {
    var tmp = array[one]
    array[one] = array[two]
    array[two] = tmp
}

function loop(begin, end, callback) {
    for (var i = begin; i < end; i++) {
        callback(i)
    }
}

function compareWithLastAndSwap(array, left, right, storeIndex, cmp) {
    if (compare(array, left, right, cmp) < 0) {
        swap(array, left, storeIndex);
        storeIndex++;
    }    
    return storeIndex
}

function compare(array, i1, i2, cmp) {
    var left = array[i1]
    var right = array[i2]
    return cmp(left, right)
}