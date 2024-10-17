
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

function compareWithLastAndSwap(array, i, last, storeIndex, compare) {
    if (compare(array, i, last) < 0) {
        swap(collection, i, storeIndex);
        storeIndex++;
    }    
    return storeIndex
}