
function swap(array, one, two) {
    var tmp = array[one]
    array[one] = array[two]
    array[two] = tmp
}

function loop(first, last, increment, callback) {
    for (var i = first; i <= last; i += increment) {
        callback(i)
    }
}