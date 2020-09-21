const isTrue = (text) => {
    let reg = /layer\.open/g
    return reg.test(text)
}

exports.isFinish = isTrue