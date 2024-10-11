

function sonCore() {
    var path, fs, process
    var unit = {}
    unit.inject = function (path_, fs_, prosess_) {
        path = path_,
        fs = fs_,
        process = prosess_
    }

    unit.main = function(input, output) {
        if (!output) {
            output = process.cwd()
        }

        console.log("son.main", input, ">", output)
    }

    return unit
}

module.exports = sonCore