fun(ioModule, filename, data)

async function wrapper() {
    await ioModule.writeFile(filename, data, "utf-8")
}

