async function* _decode(iterable) {

}

function decode(iterable) {
  if (iterable[Symbol.iterator]) {
    return _decodeSync(iterable)
  }
  return _decode(iterable)
}

module.export = {
  encode,
  decode
}
