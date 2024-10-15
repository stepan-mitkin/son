pfun(array)

const prop = "name"
var rightVal


array.sort((left, right) => {
    leftVal = left[prop]
    rightVal = right[prop]    
    return leftVal.localeCompare(rightVal)
})