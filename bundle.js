(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\lib\\_empty.js":[function(require,module,exports){

},{}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\browser-resolve\\empty.js":[function(require,module,exports){
arguments[4]["C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\lib\\_empty.js"][0].apply(exports,arguments)
},{}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\buffer\\index.js":[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var kMaxLength = 0x3fffffff
var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined' && object.buffer instanceof ArrayBuffer) {
    return fromTypedArray(that, object)
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = String(string)

  if (string.length === 0) return 0

  switch (encoding || 'utf8') {
    case 'ascii':
    case 'binary':
    case 'raw':
      return string.length
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return string.length * 2
    case 'hex':
      return string.length >>> 1
    case 'utf8':
    case 'utf-8':
      return utf8ToBytes(string).length
    case 'base64':
      return base64ToBytes(string).length
    default:
      return string.length
  }
}
Buffer.byteLength = byteLength

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function toString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z\-]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []
  var i = 0

  for (; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (leadSurrogate) {
        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          leadSurrogate = codePoint
          continue
        } else {
          // valid surrogate pair
          codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
          leadSurrogate = null
        }
      } else {
        // no lead yet

        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else {
          // valid lead
          leadSurrogate = codePoint
          continue
        }
      }
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
      leadSurrogate = null
    }

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x200000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

},{"base64-js":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\buffer\\node_modules\\base64-js\\lib\\b64.js","ieee754":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\buffer\\node_modules\\ieee754\\index.js","is-array":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\buffer\\node_modules\\is-array\\index.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\buffer\\node_modules\\base64-js\\lib\\b64.js":[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\buffer\\node_modules\\ieee754\\index.js":[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\buffer\\node_modules\\is-array\\index.js":[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\events\\events.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\http-browserify\\index.js":[function(require,module,exports){
var http = module.exports;
var EventEmitter = require('events').EventEmitter;
var Request = require('./lib/request');
var url = require('url')

http.request = function (params, cb) {
    if (typeof params === 'string') {
        params = url.parse(params)
    }
    if (!params) params = {};
    if (!params.host && !params.port) {
        params.port = parseInt(window.location.port, 10);
    }
    if (!params.host && params.hostname) {
        params.host = params.hostname;
    }

    if (!params.protocol) {
        if (params.scheme) {
            params.protocol = params.scheme + ':';
        } else {
            params.protocol = window.location.protocol;
        }
    }

    if (!params.host) {
        params.host = window.location.hostname || window.location.host;
    }
    if (/:/.test(params.host)) {
        if (!params.port) {
            params.port = params.host.split(':')[1];
        }
        params.host = params.host.split(':')[0];
    }
    if (!params.port) params.port = params.protocol == 'https:' ? 443 : 80;
    
    var req = new Request(new xhrHttp, params);
    if (cb) req.on('response', cb);
    return req;
};

http.get = function (params, cb) {
    params.method = 'GET';
    var req = http.request(params, cb);
    req.end();
    return req;
};

http.Agent = function () {};
http.Agent.defaultMaxSockets = 4;

var xhrHttp = (function () {
    if (typeof window === 'undefined') {
        throw new Error('no window object present');
    }
    else if (window.XMLHttpRequest) {
        return window.XMLHttpRequest;
    }
    else if (window.ActiveXObject) {
        var axs = [
            'Msxml2.XMLHTTP.6.0',
            'Msxml2.XMLHTTP.3.0',
            'Microsoft.XMLHTTP'
        ];
        for (var i = 0; i < axs.length; i++) {
            try {
                var ax = new(window.ActiveXObject)(axs[i]);
                return function () {
                    if (ax) {
                        var ax_ = ax;
                        ax = null;
                        return ax_;
                    }
                    else {
                        return new(window.ActiveXObject)(axs[i]);
                    }
                };
            }
            catch (e) {}
        }
        throw new Error('ajax not supported in this browser')
    }
    else {
        throw new Error('ajax not supported in this browser');
    }
})();

http.STATUS_CODES = {
    100 : 'Continue',
    101 : 'Switching Protocols',
    102 : 'Processing',                 // RFC 2518, obsoleted by RFC 4918
    200 : 'OK',
    201 : 'Created',
    202 : 'Accepted',
    203 : 'Non-Authoritative Information',
    204 : 'No Content',
    205 : 'Reset Content',
    206 : 'Partial Content',
    207 : 'Multi-Status',               // RFC 4918
    300 : 'Multiple Choices',
    301 : 'Moved Permanently',
    302 : 'Moved Temporarily',
    303 : 'See Other',
    304 : 'Not Modified',
    305 : 'Use Proxy',
    307 : 'Temporary Redirect',
    400 : 'Bad Request',
    401 : 'Unauthorized',
    402 : 'Payment Required',
    403 : 'Forbidden',
    404 : 'Not Found',
    405 : 'Method Not Allowed',
    406 : 'Not Acceptable',
    407 : 'Proxy Authentication Required',
    408 : 'Request Time-out',
    409 : 'Conflict',
    410 : 'Gone',
    411 : 'Length Required',
    412 : 'Precondition Failed',
    413 : 'Request Entity Too Large',
    414 : 'Request-URI Too Large',
    415 : 'Unsupported Media Type',
    416 : 'Requested Range Not Satisfiable',
    417 : 'Expectation Failed',
    418 : 'I\'m a teapot',              // RFC 2324
    422 : 'Unprocessable Entity',       // RFC 4918
    423 : 'Locked',                     // RFC 4918
    424 : 'Failed Dependency',          // RFC 4918
    425 : 'Unordered Collection',       // RFC 4918
    426 : 'Upgrade Required',           // RFC 2817
    428 : 'Precondition Required',      // RFC 6585
    429 : 'Too Many Requests',          // RFC 6585
    431 : 'Request Header Fields Too Large',// RFC 6585
    500 : 'Internal Server Error',
    501 : 'Not Implemented',
    502 : 'Bad Gateway',
    503 : 'Service Unavailable',
    504 : 'Gateway Time-out',
    505 : 'HTTP Version Not Supported',
    506 : 'Variant Also Negotiates',    // RFC 2295
    507 : 'Insufficient Storage',       // RFC 4918
    509 : 'Bandwidth Limit Exceeded',
    510 : 'Not Extended',               // RFC 2774
    511 : 'Network Authentication Required' // RFC 6585
};
},{"./lib/request":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\http-browserify\\lib\\request.js","events":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\events\\events.js","url":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\url\\url.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\http-browserify\\lib\\request.js":[function(require,module,exports){
var Stream = require('stream');
var Response = require('./response');
var Base64 = require('Base64');
var inherits = require('inherits');

var Request = module.exports = function (xhr, params) {
    var self = this;
    self.writable = true;
    self.xhr = xhr;
    self.body = [];
    
    self.uri = (params.protocol || 'http:') + '//'
        + params.host
        + (params.port ? ':' + params.port : '')
        + (params.path || '/')
    ;
    
    if (typeof params.withCredentials === 'undefined') {
        params.withCredentials = true;
    }

    try { xhr.withCredentials = params.withCredentials }
    catch (e) {}
    
    if (params.responseType) try { xhr.responseType = params.responseType }
    catch (e) {}
    
    xhr.open(
        params.method || 'GET',
        self.uri,
        true
    );

    xhr.onerror = function(event) {
        self.emit('error', new Error('Network error'));
    };

    self._headers = {};
    
    if (params.headers) {
        var keys = objectKeys(params.headers);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (!self.isSafeRequestHeader(key)) continue;
            var value = params.headers[key];
            self.setHeader(key, value);
        }
    }
    
    if (params.auth) {
        //basic auth
        this.setHeader('Authorization', 'Basic ' + Base64.btoa(params.auth));
    }

    var res = new Response;
    res.on('close', function () {
        self.emit('close');
    });
    
    res.on('ready', function () {
        self.emit('response', res);
    });

    res.on('error', function (err) {
        self.emit('error', err);
    });
    
    xhr.onreadystatechange = function () {
        // Fix for IE9 bug
        // SCRIPT575: Could not complete the operation due to error c00c023f
        // It happens when a request is aborted, calling the success callback anyway with readyState === 4
        if (xhr.__aborted) return;
        res.handle(xhr);
    };
};

inherits(Request, Stream);

Request.prototype.setHeader = function (key, value) {
    this._headers[key.toLowerCase()] = value
};

Request.prototype.getHeader = function (key) {
    return this._headers[key.toLowerCase()]
};

Request.prototype.removeHeader = function (key) {
    delete this._headers[key.toLowerCase()]
};

Request.prototype.write = function (s) {
    this.body.push(s);
};

Request.prototype.destroy = function (s) {
    this.xhr.__aborted = true;
    this.xhr.abort();
    this.emit('close');
};

Request.prototype.end = function (s) {
    if (s !== undefined) this.body.push(s);

    var keys = objectKeys(this._headers);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = this._headers[key];
        if (isArray(value)) {
            for (var j = 0; j < value.length; j++) {
                this.xhr.setRequestHeader(key, value[j]);
            }
        }
        else this.xhr.setRequestHeader(key, value)
    }

    if (this.body.length === 0) {
        this.xhr.send('');
    }
    else if (typeof this.body[0] === 'string') {
        this.xhr.send(this.body.join(''));
    }
    else if (isArray(this.body[0])) {
        var body = [];
        for (var i = 0; i < this.body.length; i++) {
            body.push.apply(body, this.body[i]);
        }
        this.xhr.send(body);
    }
    else if (/Array/.test(Object.prototype.toString.call(this.body[0]))) {
        var len = 0;
        for (var i = 0; i < this.body.length; i++) {
            len += this.body[i].length;
        }
        var body = new(this.body[0].constructor)(len);
        var k = 0;
        
        for (var i = 0; i < this.body.length; i++) {
            var b = this.body[i];
            for (var j = 0; j < b.length; j++) {
                body[k++] = b[j];
            }
        }
        this.xhr.send(body);
    }
    else if (isXHR2Compatible(this.body[0])) {
        this.xhr.send(this.body[0]);
    }
    else {
        var body = '';
        for (var i = 0; i < this.body.length; i++) {
            body += this.body[i].toString();
        }
        this.xhr.send(body);
    }
};

// Taken from http://dxr.mozilla.org/mozilla/mozilla-central/content/base/src/nsXMLHttpRequest.cpp.html
Request.unsafeHeaders = [
    "accept-charset",
    "accept-encoding",
    "access-control-request-headers",
    "access-control-request-method",
    "connection",
    "content-length",
    "cookie",
    "cookie2",
    "content-transfer-encoding",
    "date",
    "expect",
    "host",
    "keep-alive",
    "origin",
    "referer",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "user-agent",
    "via"
];

Request.prototype.isSafeRequestHeader = function (headerName) {
    if (!headerName) return false;
    return indexOf(Request.unsafeHeaders, headerName.toLowerCase()) === -1;
};

var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

var indexOf = function (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (xs[i] === x) return i;
    }
    return -1;
};

var isXHR2Compatible = function (obj) {
    if (typeof Blob !== 'undefined' && obj instanceof Blob) return true;
    if (typeof ArrayBuffer !== 'undefined' && obj instanceof ArrayBuffer) return true;
    if (typeof FormData !== 'undefined' && obj instanceof FormData) return true;
};

},{"./response":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\http-browserify\\lib\\response.js","Base64":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\http-browserify\\node_modules\\Base64\\base64.js","inherits":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\inherits\\inherits_browser.js","stream":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\stream-browserify\\index.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\http-browserify\\lib\\response.js":[function(require,module,exports){
var Stream = require('stream');
var util = require('util');

var Response = module.exports = function (res) {
    this.offset = 0;
    this.readable = true;
};

util.inherits(Response, Stream);

var capable = {
    streaming : true,
    status2 : true
};

function parseHeaders (res) {
    var lines = res.getAllResponseHeaders().split(/\r?\n/);
    var headers = {};
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line === '') continue;
        
        var m = line.match(/^([^:]+):\s*(.*)/);
        if (m) {
            var key = m[1].toLowerCase(), value = m[2];
            
            if (headers[key] !== undefined) {
            
                if (isArray(headers[key])) {
                    headers[key].push(value);
                }
                else {
                    headers[key] = [ headers[key], value ];
                }
            }
            else {
                headers[key] = value;
            }
        }
        else {
            headers[line] = true;
        }
    }
    return headers;
}

Response.prototype.getResponse = function (xhr) {
    var respType = String(xhr.responseType).toLowerCase();
    if (respType === 'blob') return xhr.responseBlob || xhr.response;
    if (respType === 'arraybuffer') return xhr.response;
    return xhr.responseText;
}

Response.prototype.getHeader = function (key) {
    return this.headers[key.toLowerCase()];
};

Response.prototype.handle = function (res) {
    if (res.readyState === 2 && capable.status2) {
        try {
            this.statusCode = res.status;
            this.headers = parseHeaders(res);
        }
        catch (err) {
            capable.status2 = false;
        }
        
        if (capable.status2) {
            this.emit('ready');
        }
    }
    else if (capable.streaming && res.readyState === 3) {
        try {
            if (!this.statusCode) {
                this.statusCode = res.status;
                this.headers = parseHeaders(res);
                this.emit('ready');
            }
        }
        catch (err) {}
        
        try {
            this._emitData(res);
        }
        catch (err) {
            capable.streaming = false;
        }
    }
    else if (res.readyState === 4) {
        if (!this.statusCode) {
            this.statusCode = res.status;
            this.emit('ready');
        }
        this._emitData(res);
        
        if (res.error) {
            this.emit('error', this.getResponse(res));
        }
        else this.emit('end');
        
        this.emit('close');
    }
};

Response.prototype._emitData = function (res) {
    var respBody = this.getResponse(res);
    if (respBody.toString().match(/ArrayBuffer/)) {
        this.emit('data', new Uint8Array(respBody, this.offset));
        this.offset = respBody.byteLength;
        return;
    }
    if (respBody.length > this.offset) {
        this.emit('data', respBody.slice(this.offset));
        this.offset = respBody.length;
    }
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

},{"stream":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\stream-browserify\\index.js","util":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\util\\util.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\http-browserify\\node_modules\\Base64\\base64.js":[function(require,module,exports){
;(function () {

  var object = typeof exports != 'undefined' ? exports : this; // #8: web workers
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  function InvalidCharacterError(message) {
    this.message = message;
  }
  InvalidCharacterError.prototype = new Error;
  InvalidCharacterError.prototype.name = 'InvalidCharacterError';

  // encoder
  // [https://gist.github.com/999166] by [https://github.com/nignag]
  object.btoa || (
  object.btoa = function (input) {
    for (
      // initialize result and counter
      var block, charCode, idx = 0, map = chars, output = '';
      // if the next input index does not exist:
      //   change the mapping table to "="
      //   check if d has no fractional digits
      input.charAt(idx | 0) || (map = '=', idx % 1);
      // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
      output += map.charAt(63 & block >> 8 - idx % 1 * 8)
    ) {
      charCode = input.charCodeAt(idx += 3/4);
      if (charCode > 0xFF) {
        throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      block = block << 8 | charCode;
    }
    return output;
  });

  // decoder
  // [https://gist.github.com/1020396] by [https://github.com/atk]
  object.atob || (
  object.atob = function (input) {
    input = input.replace(/=+$/, '');
    if (input.length % 4 == 1) {
      throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    for (
      // initialize result and counters
      var bc = 0, bs, buffer, idx = 0, output = '';
      // get next character
      buffer = input.charAt(idx++);
      // character found in table? initialize bit storage and add its ascii value;
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        // and if not first of each 4 characters,
        // convert the first 8 bits to one ascii character
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      // try to find character in table (0-63, not found => -1)
      buffer = chars.indexOf(buffer);
    }
    return output;
  });

}());

},{}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\inherits\\inherits_browser.js":[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\isarray\\index.js":[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\path-browserify\\index.js":[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))

},{"_process":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\process\\browser.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\process\\browser.js":[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\punycode\\punycode.js":[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.3.2 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.3.2',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\querystring-es3\\decode.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\querystring-es3\\encode.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\querystring-es3\\index.js":[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\querystring-es3\\decode.js","./encode":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\querystring-es3\\encode.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\duplex.js":[function(require,module,exports){
module.exports = require("./lib/_stream_duplex.js")

},{"./lib/_stream_duplex.js":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_duplex.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_duplex.js":[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

module.exports = Duplex;

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}
/*</replacement>*/


/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

forEach(objectKeys(Writable.prototype), function(method) {
  if (!Duplex.prototype[method])
    Duplex.prototype[method] = Writable.prototype[method];
});

function Duplex(options) {
  if (!(this instanceof Duplex))
    return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false)
    this.readable = false;

  if (options && options.writable === false)
    this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false)
    this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended)
    return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  process.nextTick(this.end.bind(this));
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

}).call(this,require('_process'))

},{"./_stream_readable":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_readable.js","./_stream_writable":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_writable.js","_process":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\process\\browser.js","core-util-is":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\node_modules\\core-util-is\\lib\\util.js","inherits":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\inherits\\inherits_browser.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_passthrough.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough))
    return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function(chunk, encoding, cb) {
  cb(null, chunk);
};

},{"./_stream_transform":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_transform.js","core-util-is":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\node_modules\\core-util-is\\lib\\util.js","inherits":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\inherits\\inherits_browser.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_readable.js":[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Readable;

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/


/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Readable.ReadableState = ReadableState;

var EE = require('events').EventEmitter;

/*<replacement>*/
if (!EE.listenerCount) EE.listenerCount = function(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

var Stream = require('stream');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var StringDecoder;


/*<replacement>*/
var debug = require('util');
if (debug && debug.debuglog) {
  debug = debug.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/


util.inherits(Readable, Stream);

function ReadableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;


  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.readableObjectMode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder)
      StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  var Duplex = require('./_stream_duplex');

  if (!(this instanceof Readable))
    return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function(chunk, encoding) {
  var state = this._readableState;

  if (util.isString(chunk) && !state.objectMode) {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function(chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (util.isNullOrUndefined(chunk)) {
    state.reading = false;
    if (!state.ended)
      onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      if (state.decoder && !addToFront && !encoding)
        chunk = state.decoder.write(chunk);

      if (!addToFront)
        state.reading = false;

      // if we want the data now, just emit it.
      if (state.flowing && state.length === 0 && !state.sync) {
        stream.emit('data', chunk);
        stream.read(0);
      } else {
        // update the buffer info.
        state.length += state.objectMode ? 1 : chunk.length;
        if (addToFront)
          state.buffer.unshift(chunk);
        else
          state.buffer.push(chunk);

        if (state.needReadable)
          emitReadable(stream);
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}



// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended &&
         (state.needReadable ||
          state.length < state.highWaterMark ||
          state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function(enc) {
  if (!StringDecoder)
    StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 128MB
var MAX_HWM = 0x800000;
function roundUpToNextPowerOf2(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    for (var p = 1; p < 32; p <<= 1) n |= n >> p;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended)
    return 0;

  if (state.objectMode)
    return n === 0 ? 0 : 1;

  if (isNaN(n) || util.isNull(n)) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length)
      return state.buffer[0].length;
    else
      return state.length;
  }

  if (n <= 0)
    return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark)
    state.highWaterMark = roundUpToNextPowerOf2(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else
      return state.length;
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function(n) {
  debug('read', n);
  var state = this._readableState;
  var nOrig = n;

  if (!util.isNumber(n) || n > 0)
    state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 &&
      state.needReadable &&
      (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended)
      endReadable(this);
    else
      emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0)
      endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  }

  if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0)
      state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read pushed data synchronously, then `reading` will be false,
  // and we need to re-evaluate how much data we can return to the user.
  if (doRead && !state.reading)
    n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0)
    ret = fromList(n, state);
  else
    ret = null;

  if (util.isNull(ret)) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended)
    state.needReadable = true;

  // If we tried to read() past the EOF, then emit end on the next tick.
  if (nOrig !== n && state.ended && state.length === 0)
    endReadable(this);

  if (!util.isNull(ret))
    this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!util.isBuffer(chunk) &&
      !util.isString(chunk) &&
      !util.isNullOrUndefined(chunk) &&
      !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}


function onEofChunk(stream, state) {
  if (state.decoder && !state.ended) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync)
      process.nextTick(function() {
        emitReadable_(stream);
      });
    else
      emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}


// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    process.nextTick(function() {
      maybeReadMore_(stream, state);
    });
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended &&
         state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;
    else
      len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function(n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function(dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
              dest !== process.stdout &&
              dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted)
    process.nextTick(endFn);
  else
    src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain &&
        (!dest._writableState || dest._writableState.needDrain))
      ondrain();
  }

  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    if (false === ret) {
      debug('false write response, pause',
            src._readableState.awaitDrain);
      src._readableState.awaitDrain++;
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EE.listenerCount(dest, 'error') === 0)
      dest.emit('error', er);
  }
  // This is a brutally ugly hack to make sure that our error handler
  // is attached before any userland ones.  NEVER DO THIS.
  if (!dest._events || !dest._events.error)
    dest.on('error', onerror);
  else if (isArray(dest._events.error))
    dest._events.error.unshift(onerror);
  else
    dest._events.error = [onerror, dest._events.error];



  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function() {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain)
      state.awaitDrain--;
    if (state.awaitDrain === 0 && EE.listenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}


Readable.prototype.unpipe = function(dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0)
    return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes)
      return this;

    if (!dest)
      dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest)
      dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++)
      dests[i].emit('unpipe', this);
    return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1)
    return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1)
    state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function(ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  // If listening to data, and it has not explicitly been paused,
  // then call resume to start the flow of data on the next tick.
  if (ev === 'data' && false !== this._readableState.flowing) {
    this.resume();
  }

  if (ev === 'readable' && this.readable) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        var self = this;
        process.nextTick(function() {
          debug('readable nexttick read 0');
          self.read(0);
        });
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function() {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    if (!state.reading) {
      debug('resume read 0');
      this.read(0);
    }
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    process.nextTick(function() {
      resume_(stream, state);
    });
  }
}

function resume_(stream, state) {
  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading)
    stream.read(0);
}

Readable.prototype.pause = function() {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  if (state.flowing) {
    do {
      var chunk = stream.read();
    } while (null !== chunk && state.flowing);
  }
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function(stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function() {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length)
        self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function(chunk) {
    debug('wrapped data');
    if (state.decoder)
      chunk = state.decoder.write(chunk);
    if (!chunk || !state.objectMode && !chunk.length)
      return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (util.isFunction(stream[i]) && util.isUndefined(this[i])) {
      this[i] = function(method) { return function() {
        return stream[method].apply(stream, arguments);
      }}(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function(ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function(n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};



// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0)
    return null;

  if (length === 0)
    ret = null;
  else if (objectMode)
    ret = list.shift();
  else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode)
      ret = list.join('');
    else
      ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode)
        ret = '';
      else
        ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode)
          ret += buf.slice(0, cpy);
        else
          buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length)
          list[0] = buf.slice(cpy);
        else
          list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0)
    throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    process.nextTick(function() {
      // Check that we didn't get one last unshift.
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit('end');
      }
    });
  }
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf (xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

}).call(this,require('_process'))

},{"./_stream_duplex":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_duplex.js","_process":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\process\\browser.js","buffer":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\buffer\\index.js","core-util-is":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\node_modules\\core-util-is\\lib\\util.js","events":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\events\\events.js","inherits":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\inherits\\inherits_browser.js","isarray":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\isarray\\index.js","stream":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\stream-browserify\\index.js","string_decoder/":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\string_decoder\\index.js","util":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\browser-resolve\\empty.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_transform.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.


// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);


function TransformState(options, stream) {
  this.afterTransform = function(er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb)
    return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (!util.isNullOrUndefined(data))
    stream.push(data);

  if (cb)
    cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}


function Transform(options) {
  if (!(this instanceof Transform))
    return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(options, this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  this.once('prefinish', function() {
    if (util.isFunction(this._flush))
      this._flush(function(er) {
        done(stream, er);
      });
    else
      done(stream);
  });
}

Transform.prototype.push = function(chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function(chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function(chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform ||
        rs.needReadable ||
        rs.length < rs.highWaterMark)
      this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function(n) {
  var ts = this._transformState;

  if (!util.isNull(ts.writechunk) && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};


function done(stream, er) {
  if (er)
    return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length)
    throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming)
    throw new Error('calling transform done when still transforming');

  return stream.push(null);
}

},{"./_stream_duplex":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_duplex.js","core-util-is":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\node_modules\\core-util-is\\lib\\util.js","inherits":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\inherits\\inherits_browser.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_writable.js":[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, cb), and it'll handle all
// the drain event emission and buffering.

module.exports = Writable;

/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Writable.WritableState = WritableState;


/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Stream = require('stream');

util.inherits(Writable, Stream);

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
}

function WritableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.writableObjectMode;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function(er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.buffer = [];

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;
}

function Writable(options) {
  var Duplex = require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Duplex))
    return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function() {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};


function writeAfterEnd(stream, state, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  process.nextTick(function() {
    cb(er);
  });
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  if (!util.isBuffer(chunk) &&
      !util.isString(chunk) &&
      !util.isNullOrUndefined(chunk) &&
      !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    process.nextTick(function() {
      cb(er);
    });
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function(chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (util.isFunction(encoding)) {
    cb = encoding;
    encoding = null;
  }

  if (util.isBuffer(chunk))
    encoding = 'buffer';
  else if (!encoding)
    encoding = state.defaultEncoding;

  if (!util.isFunction(cb))
    cb = function() {};

  if (state.ended)
    writeAfterEnd(this, state, cb);
  else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function() {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function() {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing &&
        !state.corked &&
        !state.finished &&
        !state.bufferProcessing &&
        state.buffer.length)
      clearBuffer(this, state);
  }
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode &&
      state.decodeStrings !== false &&
      util.isString(chunk)) {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);
  if (util.isBuffer(chunk))
    encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret)
    state.needDrain = true;

  if (state.writing || state.corked)
    state.buffer.push(new WriteReq(chunk, encoding, cb));
  else
    doWrite(stream, state, false, len, chunk, encoding, cb);

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev)
    stream._writev(chunk, state.onwrite);
  else
    stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  if (sync)
    process.nextTick(function() {
      state.pendingcb--;
      cb(er);
    });
  else {
    state.pendingcb--;
    cb(er);
  }

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er)
    onwriteError(stream, state, sync, er, cb);
  else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(stream, state);

    if (!finished &&
        !state.corked &&
        !state.bufferProcessing &&
        state.buffer.length) {
      clearBuffer(stream, state);
    }

    if (sync) {
      process.nextTick(function() {
        afterWrite(stream, state, finished, cb);
      });
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished)
    onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}


// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;

  if (stream._writev && state.buffer.length > 1) {
    // Fast case, write everything using _writev()
    var cbs = [];
    for (var c = 0; c < state.buffer.length; c++)
      cbs.push(state.buffer[c].callback);

    // count the one we are adding, as well.
    // TODO(isaacs) clean this up
    state.pendingcb++;
    doWrite(stream, state, true, state.length, state.buffer, '', function(err) {
      for (var i = 0; i < cbs.length; i++) {
        state.pendingcb--;
        cbs[i](err);
      }
    });

    // Clear buffer
    state.buffer = [];
  } else {
    // Slow case, write chunks one-by-one
    for (var c = 0; c < state.buffer.length; c++) {
      var entry = state.buffer[c];
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);

      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        c++;
        break;
      }
    }

    if (c < state.buffer.length)
      state.buffer = state.buffer.slice(c);
    else
      state.buffer.length = 0;
  }

  state.bufferProcessing = false;
}

Writable.prototype._write = function(chunk, encoding, cb) {
  cb(new Error('not implemented'));

};

Writable.prototype._writev = null;

Writable.prototype.end = function(chunk, encoding, cb) {
  var state = this._writableState;

  if (util.isFunction(chunk)) {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (util.isFunction(encoding)) {
    cb = encoding;
    encoding = null;
  }

  if (!util.isNullOrUndefined(chunk))
    this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished)
    endWritable(this, state, cb);
};


function needFinish(stream, state) {
  return (state.ending &&
          state.length === 0 &&
          !state.finished &&
          !state.writing);
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(stream, state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else
      prefinish(stream, state);
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished)
      process.nextTick(cb);
    else
      stream.once('finish', cb);
  }
  state.ended = true;
}

}).call(this,require('_process'))

},{"./_stream_duplex":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_duplex.js","_process":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\process\\browser.js","buffer":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\buffer\\index.js","core-util-is":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\node_modules\\core-util-is\\lib\\util.js","inherits":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\inherits\\inherits_browser.js","stream":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\stream-browserify\\index.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\node_modules\\core-util-is\\lib\\util.js":[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

function isBuffer(arg) {
  return Buffer.isBuffer(arg);
}
exports.isBuffer = isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}
}).call(this,require("buffer").Buffer)

},{"buffer":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\buffer\\index.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\passthrough.js":[function(require,module,exports){
module.exports = require("./lib/_stream_passthrough.js")

},{"./lib/_stream_passthrough.js":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_passthrough.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\readable.js":[function(require,module,exports){
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = require('stream');
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_duplex.js","./lib/_stream_passthrough.js":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_passthrough.js","./lib/_stream_readable.js":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_readable.js","./lib/_stream_transform.js":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_transform.js","./lib/_stream_writable.js":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_writable.js","stream":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\stream-browserify\\index.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\transform.js":[function(require,module,exports){
module.exports = require("./lib/_stream_transform.js")

},{"./lib/_stream_transform.js":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_transform.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\writable.js":[function(require,module,exports){
module.exports = require("./lib/_stream_writable.js")

},{"./lib/_stream_writable.js":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\lib\\_stream_writable.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\stream-browserify\\index.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\events\\events.js","inherits":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\inherits\\inherits_browser.js","readable-stream/duplex.js":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\duplex.js","readable-stream/passthrough.js":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\passthrough.js","readable-stream/readable.js":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\readable.js","readable-stream/transform.js":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\transform.js","readable-stream/writable.js":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\readable-stream\\writable.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\string_decoder\\index.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
};


// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

},{"buffer":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\buffer\\index.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\url\\url.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var punycode = require('punycode');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a puny coded representation of "domain".
      // It only converts the part of the domain name that
      // has non ASCII characters. I.e. it dosent matter if
      // you call it with a domain that already is in ASCII.
      var domainArray = this.hostname.split('.');
      var newOut = [];
      for (var i = 0; i < domainArray.length; ++i) {
        var s = domainArray[i];
        newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
            'xn--' + punycode.encode(s) : s);
      }
      this.hostname = newOut.join('.');
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  Object.keys(this).forEach(function(k) {
    result[k] = this[k];
  }, this);

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    Object.keys(relative).forEach(function(k) {
      if (k !== 'protocol')
        result[k] = relative[k];
    });

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      Object.keys(relative).forEach(function(k) {
        result[k] = relative[k];
      });
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especialy happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!isNull(result.pathname) || !isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especialy happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!isNull(result.pathname) || !isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

function isString(arg) {
  return typeof arg === "string";
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isNull(arg) {
  return arg === null;
}
function isNullOrUndefined(arg) {
  return  arg == null;
}

},{"punycode":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\punycode\\punycode.js","querystring":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\querystring-es3\\index.js"}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\util\\support\\isBufferBrowser.js":[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\util\\util.js":[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\util\\support\\isBufferBrowser.js","_process":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\process\\browser.js","inherits":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\inherits\\inherits_browser.js"}],"C:\\ksana2015\\kage-glyph-sample\\dgg.js":[function(require,module,exports){
// dgg.js -- functions for dynamic glyph generation
console.log('loading ddg.js');
//browserify -t reactify index.js
//var glyph=GLYPH;
//var glyphs=GLYPHS;
var ucs2string=require("./src/uniutil").ucs2string;
var ucs=function(c){ // 回 unicode 字串對應的中文字
	if(c)return ucs2string(parseInt(c.substr(1),16)).replace(/\r/,'');}
var decode=function(infos){
	var glyphs=infos.split('$').map(function(info){
		var values=info.split(":");
		var t=values[0], sd=values[1], ed=values[2], x, y;
		var points=[], xyPairs=t=='99'?values.slice(3,7):values.slice(3);
		xyPairs.forEach(function(v,i){ var n=v;
			if(i%2===0) x=n;
			else { y=n, points.push([parseInt(x),parseInt(y)]), x=undefined; }
		});
		var glyph={t:parseInt(t),sd:parseInt(sd),ed:parseInt(ed),p:points};
		if(x!==undefined) {
			glyph.partId=x;
		//	console.log("partId",x);
		}
		return glyph;
	})
	return glyphs;
}

var getPoints=function(glyphs){ 
	var points=[];
	glyphs.forEach(function(glyph){
		glyph.p.forEach(function(point){
			points.push(point);
		})
	});
	return points;
}
var getPartRect=function(glyphs,partId){ 
	var frameHieght, frameWidth;
	for(var i=0; i<glyphs.length; i++){
		glyph=glyphs[i].replace(/~/g,"99:0:0:");
		if(glyph.partId===partId){
			return glyph.p;
		}n
	}
}
var minimumBounding=function(points){
	if (typeof points=="string") {
		g=decode(points);
		points=getPoints(g);
	}
	var mbf=[1000,1000,-1000,-1000];
	points.forEach( function(p){
		var x=p[0],y=p[1];
		if (x<mbf[0]) mbf[0]=p[0];
		if (y<mbf[1]) mbf[1]=p[1];

		if (x>mbf[2]) mbf[2]=x;
		if (y>mbf[3]) mbf[3]=y;
	});
	return mbf;
}
var mbf=function(data,a){
	return minimumBounding(getPoints(decode(data[a])));
}
var adjustMbf=function (dMbf,aMbf,rect){
	var Ld=dMbf[0], Td=dMbf[1], Rd=dMbf[2], Bd=dMbf[3], Wd=Rd-Ld, Hd=Bd-Td;
	var La=aMbf[0], Ta=aMbf[1], Ra=aMbf[2], Ba=aMbf[3], Wa=Ra-La, Ha=Ba-Ta;
	var Lc=rect[0][0], Tc=rect[0][1], Rc=rect[1][0], Bc=rect[1][1], Wc=Rc-Lc, Hc=Bc-Tc;	// sam
	var L=Math.round(Lc-(Wd-Wa)/400), T=Math.round(Tc-(Hd-Ha)/400); // sam
	var Wx=Wc*Wd/Wa, Hx=Hc*Hd/Ha; // sam
	var R=Math.round(L+Wx), B=Math.round(T+Hx);
//	var Cx=Lf+(Ld+Rd)/2*Wf/200, Cy=Tf+(Td+Bd)/2*Hf/200;
//	var Dx=Wf*Wd/Wa/2, Dy=Hf*Hd/Ha/2;
//	var L=Math.round(Cx-Dx), T=Math.round(Cy-Dy), R=Math.round(Cx+Dx), B=Math.round(Cy+Dy);
	var result=[L,T,R,B];
	return result;
}
var stack=[];
var partsReplace=function(data,unicodes){
	var c=unicodes.shift(), d, a;
	if(unicodes.length>1){
		d=unicodes.shift();
		if(unicodes.length>2){
			a=partsReplace(data,unicodes)
		} else {
			a=unicodes.shift();
		}
		c=partReplace(data,c,d,a);
	}
    return c;
}
var partReplace=function(data,c,d,a){
//	c='c',d='d',a='a';
	if(!Object.keys(data).length) return;
	var m=c.match(/^u[0-9a-f]+(.*)$/);
	var ua=a.match(/^u/)?ucs(a):a, ud=ucs(d), uc=ucs(c)+m[1], out=uc+ud+ua;
// 1. 萌日目 遞迴搜尋 c 萌 中 明 的 部件 d 日 換成 a 目
// 2. 𩀨從䞃致招 遞迴運作 將 部件 從 換成 䞃 繼續 再將 部件 致 換成 招
// data= {"u5b50":"1:0:2:40:31:149:31$2:22:7:149:31:136:49:102:79$1:0:4:100:72:100:182$1:0:0:14:102:186:102","u53e3":"1:12:13:42:46:42:154$1:2:2:42:46:158:46$1:22:23:158:46:158:154$1:2:2:42:154:158:154","u674e":"99:0:0:0:-2:200:216:u6728-03$99:0:0:13:101:188:181:u53e3","u6728-03":"1:0:0:20:37:180:37$1:0:0:100:14:100:86$2:32:7:95:37:64:76:14:93$2:7:0:105:37:136:73:178:86","u5b50-04":"1:12:13:42:46:42:154$1:2:2:42:46:158:46$1:22:23:158:46:158:154$1:2:2:42:154:158:154","u674f":"1:0:0:16:49:185:49$1:0:0:100:18:100:109$2:32:7:94:49:71:90:16:118$2:7:0:105:49:135:89:178:111$0:0:0:0$99:0:0:14:-50:189:200:u53e3-04","u53e3-04":"99:0:0:0:118:200:190:u53e3"}
// c=‘u674e’, d='u5b50’, a=‘u53e3’ // 將 李 u674e 的部件 子 u5b50 換成 口 u53e3
	if(!c) return;
	var dc=data[c], sd='99[^$]+:('+d+'[^$:]*)', pd=RegExp(sd), md; // 直接搜尋 部件 d
	// data['u840c']='99:0:0:0:2:200:175:u8279-03$99:0:0:0:47:200:195:u660e'
	// u840c 萌, u8279-03 艹3, u660e 明 
	// data['u660e']='99:0:0:-2:-1:234:177:u65e5-01$99:0:0:-3:0:197:200:u6708-02'
	// u660e 明, u65e5-01 日1, u6708-02 月2
	// "99:0:0:0:-2:200:216:u6728-03$99:0:0:0:-20:200:200:u5b50-04" // 取得 李 的 資訊
	if(md=dc.match(pd)){ // 若 c 含 部件 d, 則 dd 為實際 d 的 unocode
		var ds=md[0], dd=md[1]; // ds 為待替換的資訊 準備改以 rr 資訊 將 dd 換為 a 並修正 範圍
		var md=dd.match(RegExp('^'+d+'(.+)$')); // sam 20151119
		if(md && data[dd].match(pd)){ // sam 20151119
			var x=partReplace(data,dd,d,a); // sam 20151119
			data[out]=dc.replace(dd,x);
			return out; // sam 20151119
		} // sam 20151119
		var m=ds.match(/^(\d+:\d+:\d+:)([-\d]+):([-\d]+):([-\d]+):([-\d]+)/);
		var x=m.slice(2,6).map(function(n){
			return parseInt(n);
		})
		var r=[[x[0],x[1]],[x[2],x[3]]];
		var dMbf=mbf(data,dd), aMbf=mbf(data,a);
		console.log('在 '+uc+' 200x200 字形 框 ['+x.join()+'] 內 將 '+ud+' 200x200 字形 框 ['+dMbf.join()+'] 內筆畫 換為 '+ua+' 200x200 字形 框 ['+aMbf.join()+'] 內筆畫');
		var adj=adjustMbf(dMbf,aMbf,r);
		var rr=m[1]+adj.join(':')+':'+a;
		data[out]=dc=dc.replace(ds,rr);
		return out;
	};
	var sp='99[^$]+:([^$:]*)', pp=RegExp('^\\$?'+sp+'$'), pg=RegExp('(^|\\$)'+sp,'g'), mg;
	if(mg=dc.match(pg)){ // 若 c 中 含 其他組合部件, 檢視每個組合部件內是否含 部件 d
		return mg.map(function(x){
			var mp=x.match(pp), part=mp[1], temp=partReplace(data,part,d,a);
			if(temp){
				data[out]=dc=dc.replace(part,temp);
				return out;
			}
		}).reduce(function(x,y){return x||y;});
	}
}
var pp=/99[:-\d]+([a-z][a-z0-9-]*)/;
var pg=/99[:-\d]+([a-z][a-z0-9-]*)/g;
var getAllGlyphs=function(data,u){
    if(data[u])
      return;
    var i=GLYPH[u];
    if(!i)
      return;
    var d=GLYPHS[i].replace(/~/g,"99:0:0:");
    data[u]=d;
    var uu=d.match(pg); // 所有部件組字資訊
    if(!uu)
      return;
    var up=uu.map(function(u){return u.match(pp)[1];});
    console.log('data["'+u+'"]="'+data[u]+'"');
    console.log(ucs(u)+u+' <-- '+up.map(function(u){
    	return ucs(u)+u;
    }).join(' '));
	up.forEach(function(u){
    	getAllGlyphs(data,u);
    	console.log('data["'+u+'"]="'+data[u]+'"');
	});
}
module.exports={
	getPoints: getPoints,
	decode: decode,
	minimumBounding: minimumBounding,
	getPartRect: getPartRect,
	adjustMbf: adjustMbf,
	ucs: ucs,
	partsReplace: partsReplace,
	partReplace: partReplace,
	getAllGlyphs: getAllGlyphs
}
},{"./src/uniutil":"C:\\ksana2015\\kage-glyph-sample\\src\\uniutil.js"}],"C:\\ksana2015\\kage-glyph-sample\\index.js":[function(require,module,exports){
var React=require("react");
var ReactDOM=require("react-dom"); 
require("ksana2015-webruntime/livereload")(); 
var ksanagap=require("ksana2015-webruntime/ksanagap");
ksanagap.boot("kage-glyph-sample",function(){
	var Main=React.createElement(require("./src/main.jsx"));
	ksana.mainComponent=ReactDOM.render(Main,document.getElementById("main"));
});
},{"./src/main.jsx":"C:\\ksana2015\\kage-glyph-sample\\src\\main.jsx","ksana2015-webruntime/ksanagap":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\ksanagap.js","ksana2015-webruntime/livereload":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\livereload.js","react":"react","react-dom":"react-dom"}],"C:\\ksana2015\\kage-glyph-sample\\node_modules\\kage\\index.js":[function(require,module,exports){
// Reference : http://www.cam.hi-ho.ne.jp/strong_warriors/teacher/chapter0{4,5}.html

function point(x, y){
  this.x = x;
  this.y = y;
}

function getCrossPoint(x11, y11, x12, y12, x21, y21, x22, y22){ // point
  var a1 = y12 - y11;
  var b1 = x11 - x12;
  var c1 = -1 * a1 * x11 - b1 * y11;
  var a2 = y22 - y21;
  var b2 = x21 - x22;
  var c2 = -1 * a2 * x21 - b2 * y21;
  
  var temp = b1 * a2 - b2 * a1;
  if(temp == 0){ // parallel
    return false;
  }
  return new point((c1 * b2 - c2 * b1) / temp, (a1 * c2 - a2 * c1) / temp);
}

function isCross(x11, y11, x12, y12, x21, y21, x22, y22){ // boolean
  var temp = getCrossPoint(x11, y11, x12, y12, x21, y21, x22, y22);
  if(!temp){ return false; }
  if(x11 < x12 && (temp.x < x11 || x12 < temp.x) ||
     x11 > x12 && (temp.x < x12 || x11 < temp.x) ||
     y11 < y12 && (temp.y < y11 || y12 < temp.y) ||
     y11 > y12 && (temp.y < y12 || y11 < temp.y)
     ){
    return false;
  }
  if(x21 < x22 && (temp.x < x21 || x22 < temp.x) ||
     x21 > x22 && (temp.x < x22 || x21 < temp.x) ||
     y21 < y22 && (temp.y < y21 || y22 < temp.y) ||
     y21 > y22 && (temp.y < y22 || y21 < temp.y)
     ){
    return false;
  }
  return true;
}

function isCrossBox(x1, y1, x2, y2, bx1, by1, bx2, by2){ // boolean
  if(isCross(x1, y1, x2, y2, bx1, by1, bx2, by1)){ return true; }
  if(isCross(x1, y1, x2, y2, bx2, by1, bx2, by2)){ return true; }
  if(isCross(x1, y1, x2, y2, bx1, by2, bx2, by2)){ return true; }
  if(isCross(x1, y1, x2, y2, bx1, by1, bx1, by2)){ return true; }
  return false;
}

function isCrossBoxWithOthers(strokesArray, i, bx1, by1, bx2, by2){ // boolean
  for(var j = 0; j < strokesArray.length; j++){
    if(i == j){ continue; }
    switch(strokesArray[j][0]){
    case 0:
    case 8:
    case 9:
      break;
    case 6:
    case 7:
      if(isCrossBox(strokesArray[j][7],
                    strokesArray[j][8],
                    strokesArray[j][9],
                    strokesArray[j][10],
                    bx1, by1, bx2, by2)){
        return true;
      }
    case 2:
    case 12:
    case 3:
      if(isCrossBox(strokesArray[j][5],
                    strokesArray[j][6],
                    strokesArray[j][7],
                    strokesArray[j][8],
                    bx1, by1, bx2, by2)){
        return true;
      }
    default:
      if(isCrossBox(strokesArray[j][3],
                    strokesArray[j][4],
                    strokesArray[j][5],
                    strokesArray[j][6],
                    bx1, by1, bx2, by2)){
        return true;
      }
    }
  }
  return false;
}

function isCrossWithOthers(strokesArray, i, bx1, by1, bx2, by2){ // boolean
  for(var j = 0; j < strokesArray.length; j++){
    if(i == j){ continue; }
    switch(strokesArray[j][0]){
    case 0:
    case 8:
    case 9:
      break;
    case 6:
    case 7:
      if(isCross(strokesArray[j][7],
                 strokesArray[j][8],
                 strokesArray[j][9],
                 strokesArray[j][10],
                 bx1, by1, bx2, by2)){
        return true;
      }
    case 2:
    case 12:
    case 3:
      if(isCross(strokesArray[j][5],
                 strokesArray[j][6],
                 strokesArray[j][7],
                 strokesArray[j][8],
                 bx1, by1, bx2, by2)){
        return true;
      }
    default:
      if(isCross(strokesArray[j][3],
                 strokesArray[j][4],
                 strokesArray[j][5],
                 strokesArray[j][6],
                 bx1, by1, bx2, by2)){
        return true;
      }
    }
  }
  return false;
}function Buhin(number){
  // method
  function set(name, data){ // void
    this.hash[name] = data;
  }
  Buhin.prototype.push = set;
  Buhin.prototype.set = set;
  
  function search(name){ // string
    if(this.hash[name]){
      return this.hash[name];
    }
    return ""; // no data
  }
  Buhin.prototype.search = search;
  
  // property
  this.hash = {};
  
  // initialize
  // no operation
  
  return this;
}function divide_curve(kage, x1, y1, sx1, sy1, x2, y2, curve, div_curve, off_curve){
  var rate = 0.5;
  var cut = Math.floor(curve.length * rate);
  var cut_rate = cut / curve.length;
  var tx1 = x1 + (sx1 - x1) * cut_rate;
  var ty1 = y1 + (sy1 - y1) * cut_rate;
  var tx2 = sx1 + (x2 - sx1) * cut_rate;
  var ty2 = sy1 + (y2 - sy1) * cut_rate;
  var tx3 = tx1 + (tx2 - tx1) * cut_rate;
  var ty3 = ty1 + (ty2 - ty1) * cut_rate;
  
  div_curve[0] = new Array();
  div_curve[1] = new Array();
  off_curve[0] = new Array(6);
  off_curve[1] = new Array(6);
  
  // must think about 0 : <0
  var i;
  for(i = 0; i <= cut; i++){
    div_curve[0].push(curve[i]);
  }
  off_curve[0][0] = x1;
  off_curve[0][1] = y1;
  off_curve[0][2] = tx1;
  off_curve[0][3] = ty1;
  off_curve[0][4] = tx3;
  off_curve[0][5] = ty3;
  
  for(i = cut; i < curve.length; i++){
    div_curve[1].push(curve[i]);
  }
  off_curve[1][0] = tx3;
  off_curve[1][1] = ty3;
  off_curve[1][2] = tx2;
  off_curve[1][3] = ty2;
  off_curve[1][4] = x2;
  off_curve[1][5] = y2;
}

// ------------------------------------------------------------------
function find_offcurve(kage, curve, sx, sy, result){
  var nx1, ny1, nx2, ny2, tx, ty;
  var minx, miny, count, diff;
  var tt, t, x, y, ix, iy;
  var mindiff = 100000;
  var area = 8;
  var mesh = 2;
  // area = 10   mesh = 5 -> 281 calcs
  // area = 10   mesh = 4 -> 180 calcs
  // area =  8   mesh = 4 -> 169 calcs
  // area =  7.5 mesh = 3 -> 100 calcs
  // area =  8   mesh = 2 ->  97 calcs
  // area =  7   mesh = 2 ->  80 calcs
  
  nx1 = curve[0][0];
  ny1 = curve[0][1];
  nx2 = curve[curve.length - 1][0];
  ny2 = curve[curve.length - 1][1];
  
  for(tx = sx - area; tx < sx + area; tx += mesh){
    for(ty = sy - area; ty < sy + area; ty += mesh){
      count = 0;
      diff = 0;
      for(tt = 0; tt < curve.length; tt++){
        t = tt / curve.length;
        
        //calculate a dot
        x = ((1.0 - t) * (1.0 - t) * nx1 + 2.0 * t * (1.0 - t) * tx + t * t * nx2);
        y = ((1.0 - t) * (1.0 - t) * ny1 + 2.0 * t * (1.0 - t) * ty + t * t * ny2);
        
        //KATAMUKI of vector by BIBUN
        ix = (nx1 - 2.0 * tx + nx2) * 2.0 * t + (-2.0 * nx1 + 2.0 * tx);
        iy = (ny1 - 2.0 * ty + ny2) * 2.0 * t + (-2.0 * ny1 + 2.0 * ty);
        
        diff += (curve[count][0] - x) * (curve[count][0] - x) + (curve[count][1] - y) * (curve[count][1] - y);
        if(diff > mindiff){
          tt = curve.length;
        }
        count++;
      }
      if(diff < mindiff){
        minx = tx;
        miny = ty;
        mindiff = diff;
      }
    }
  }
  
  for(tx = minx - mesh + 1; tx <= minx + mesh - 1; tx += 0.5){
    for(ty = miny - mesh + 1; ty <= miny + mesh - 1; ty += 0.5){
      count = 0;
      diff = 0;
      for(tt = 0; tt < curve.length; tt++){
        t = tt / curve.length;
        
        //calculate a dot
        x = ((1.0 - t) * (1.0 - t) * nx1 + 2.0 * t * (1.0 - t) * tx + t * t * nx2);
        y = ((1.0 - t) * (1.0 - t) * ny1 + 2.0 * t * (1.0 - t) * ty + t * t * ny2);
        
        //KATAMUKI of vector by BIBUN
        ix = (nx1 - 2.0 * tx + nx2) * 2.0 * t + (-2.0 * nx1 + 2.0 * tx);
        iy = (ny1 - 2.0 * ty + ny2) * 2.0 * t + (-2.0 * ny1 + 2.0 * ty);
        
        diff += (curve[count][0] - x) * (curve[count][0] - x) + (curve[count][1] - y) * (curve[count][1] - y);
        if(diff > mindiff){
          tt = curve.length;
        }
        count++;
      }
      if(diff < mindiff){
        minx = tx;
        miny = ty;
        mindiff = diff;
      }
    }
  }
  
  result[0] = nx1;
  result[1] = ny1;
  result[2] = minx;
  result[3] = miny;
  result[4] = nx2;
  result[5] = ny2;
  result[6] = mindiff;
}

// ------------------------------------------------------------------
function get_candidate(kage, curve, a1, a2, x1, y1, sx1, sy1, x2, y2, opt3, opt4){
  var x, y, ix, iy, ir, ia, ib, tt, t, deltad;
  var hosomi = 0.5;
  
  curve[0] = new Array();
  curve[1] = new Array();
  
  for(tt = 0; tt <= 1000; tt = tt + kage.kRate){
    t = tt / 1000;
    
    //calculate a dot
    x = ((1.0 - t) * (1.0 - t) * x1 + 2.0 * t * (1.0 - t) * sx1 + t * t * x2);
    y = ((1.0 - t) * (1.0 - t) * y1 + 2.0 * t * (1.0 - t) * sy1 + t * t * y2);
    
    //KATAMUKI of vector by BIBUN
    ix = (x1 - 2.0 * sx1 + x2) * 2.0 * t + (-2.0 * x1 + 2.0 * sx1);
    iy = (y1 - 2.0 * sy1 + y2) * 2.0 * t + (-2.0 * y1 + 2.0 * sy1);
    //line SUICHOKU by vector
    if(ix != 0 && iy != 0){
      ir = Math.atan(iy / ix * -1);
      ia = Math.sin(ir) * (kage.kMinWidthT);
      ib = Math.cos(ir) * (kage.kMinWidthT);
    }
    else if(ix == 0){
      ia = kage.kMinWidthT;
      ib = 0;
    }
    else{
      ia = 0;
      ib = kage.kMinWidthT;
    }
    
    if(a1 == 7 && a2 == 0){ // L2RD: fatten
      deltad = Math.pow(t, hosomi) * kage.kL2RDfatten;
    }
    else if(a1 == 7){
      deltad = Math.pow(t, hosomi);
    }
    else if(a2 == 7){
      deltad = Math.pow(1.0 - t, hosomi);
    }
    else if(opt3 > 0){
      deltad = (((kage.kMinWidthT - opt4 / 2) - opt3 / 2) / (kage.kMinWidthT - opt4 / 2)) + opt3 / 2 / (kage.kMinWidthT - opt4) * t;
    }
    else{ deltad = 1; }
    
    if(deltad < 0.15){
      deltad = 0.15;
    }
    ia = ia * deltad;
    ib = ib * deltad;
    
    //reverse if vector is going 2nd/3rd quadrants
    if(ix <= 0){
      ia = ia * -1;
      ib = ib * -1;
    }
    
    temp = new Array(2);
    temp[0] = x - ia;
    temp[1] = y - ib;
    curve[0].push(temp);
    temp = new Array(2);
    temp[0] = x + ia;
    temp[1] = y + ib;
    curve[1].push(temp);
  }
}function Kage(size){
  // method
  function makeGlyph(polygons, buhin){ // void
    var glyphData = this.kBuhin.search(buhin);
    this.makeGlyph2(polygons, glyphData);
  }
  Kage.prototype.makeGlyph = makeGlyph;
  
  function makeGlyph2(polygons, data){ // void
      if(data != ""){
	  var strokesArray = this.adjustKirikuchi(this.adjustUroko2(this.adjustUroko(this.adjustKakato(this.adjustTate(this.adjustMage(this.adjustHane(this.getEachStrokes(data))))))));
	  for(var i = 0; i < strokesArray.length; i++){
	      dfDrawFont(this, polygons,
			 strokesArray[i][0],
			 strokesArray[i][1],
			 strokesArray[i][2],
			 strokesArray[i][3],
			 strokesArray[i][4],
			 strokesArray[i][5],
			 strokesArray[i][6],
			 strokesArray[i][7],
			 strokesArray[i][8],
			 strokesArray[i][9],
			 strokesArray[i][10]);
	  }
      }
  }
  Kage.prototype.makeGlyph2 = makeGlyph2;
  
  function makeGlyph3(data){ // void
      var result = new Array();
      if(data != ""){
	  var strokesArray = this.adjustKirikuchi(this.adjustUroko2(this.adjustUroko(this.adjustKakato(this.adjustTate(this.adjustMage(this.adjustHane(this.getEachStrokes(data))))))));
	  for(var i = 0; i < strokesArray.length; i++){
	      var polygons = new Polygons();
	      dfDrawFont(this, polygons,
			 strokesArray[i][0],
			 strokesArray[i][1],
			 strokesArray[i][2],
			 strokesArray[i][3],
			 strokesArray[i][4],
			 strokesArray[i][5],
			 strokesArray[i][6],
			 strokesArray[i][7],
			 strokesArray[i][8],
			 strokesArray[i][9],
			 strokesArray[i][10]);
	      result.push(polygons);
	  }
      }
      return result;
  }
  Kage.prototype.makeGlyph3 = makeGlyph3;
  
  function getEachStrokes(glyphData){ // strokes array
    var strokesArray = new Array();
    var strokes = glyphData.split("$");
    for(var i = 0; i < strokes.length; i++){
      var columns = strokes[i].split(":");
      if(Math.floor(columns[0]) != 99){
        strokesArray.push([
          Math.floor(columns[0]),
          Math.floor(columns[1]),
          Math.floor(columns[2]),
          Math.floor(columns[3]),
          Math.floor(columns[4]),
          Math.floor(columns[5]),
          Math.floor(columns[6]),
          Math.floor(columns[7]),
          Math.floor(columns[8]),
          Math.floor(columns[9]),
          Math.floor(columns[10])
          ]);
      } else {
        var buhin = this.kBuhin.search(columns[7]);
        if(buhin != ""){
          strokesArray = strokesArray.concat(this.getEachStrokesOfBuhin(buhin,
                                                  Math.floor(columns[3]),
                                                  Math.floor(columns[4]),
                                                  Math.floor(columns[5]),
                                                  Math.floor(columns[6]),
                                                  Math.floor(columns[1]),
                                                  Math.floor(columns[2]),
                                                  Math.floor(columns[9]),
                                                  Math.floor(columns[10]))
                            );
        }
      }
    }
    return strokesArray;
  }
  Kage.prototype.getEachStrokes = getEachStrokes;
  
  function getEachStrokesOfBuhin(buhin, x1, y1, x2, y2, sx, sy, sx2, sy2){
    var temp = this.getEachStrokes(buhin);
    var result = new Array();
    var box = this.getBox(buhin);
      if(sx != 0 || sy != 0){
	  if(sx > 100){
	      sx -= 200; // Ç¤°ÕÅÀ¥â¡¼¥É
	  } else {
	      sx2 = 0; // Ãæ¿´ÅÀ¥â¡¼¥É
	      sy2 = 0;
	  }
      }
    for(var i = 0; i < temp.length; i++){
	if(sx != 0 || sy != 0){
	    temp[i][3] = stretch(sx, sx2, temp[i][3], box.minX, box.maxX);
	    temp[i][4] = stretch(sy, sy2, temp[i][4], box.minY, box.maxY);
	    temp[i][5] = stretch(sx, sx2, temp[i][5], box.minX, box.maxX);
	    temp[i][6] = stretch(sy, sy2,temp[i][6], box.minY, box.maxY);
	    if(temp[i][0] != 99){
		temp[i][7] = stretch(sx, sx2, temp[i][7], box.minX, box.maxX);	
		temp[i][8] = stretch(sy, sy2, temp[i][8], box.minY, box.maxY);
		temp[i][9] = stretch(sx, sx2, temp[i][9], box.minX, box.maxX);
		temp[i][10] = stretch(sy, sy2, temp[i][10], box.minY, box.maxY);
	    }
	}
      result.push([temp[i][0],
                   temp[i][1],
                   temp[i][2],
                   x1 + temp[i][3] * (x2 - x1) / 200,
                   y1 + temp[i][4] * (y2 - y1) / 200,
                   x1 + temp[i][5] * (x2 - x1) / 200,
                   y1 + temp[i][6] * (y2 - y1) / 200,
                   x1 + temp[i][7] * (x2 - x1) / 200,
                   y1 + temp[i][8] * (y2 - y1) / 200,
                   x1 + temp[i][9] * (x2 - x1) / 200,
                   y1 + temp[i][10] * (y2 - y1) / 200]);
    }
    return result;
  }
  Kage.prototype.getEachStrokesOfBuhin = getEachStrokesOfBuhin;
  
  function adjustHane(sa){ // strokesArray
      for(var i = 0; i < sa.length; i++){
	  if((sa[i][0] == 1 || sa[i][0] == 2 || sa[i][0] == 6) && sa[i][2] == 4){
	      var lpx; // lastPointX
	      var lpy; // lastPointY
	      if(sa[i][0] == 1){
		  lpx = sa[i][5];
		  lpy = sa[i][6];
	      } else if(sa[i][0] == 2){
		  lpx = sa[i][7];
		  lpy = sa[i][8];
	      } else {
		  lpx = sa[i][9];
		  lpy = sa[i][10];
	      }
	      var mn = Infinity; // mostNear
	      if(lpx + 18 < 100){
		  mn = lpx + 18;
	      }
	      for(var j = 0; j < sa.length; j++){
		  if(i != j && sa[j][0] == 1 && sa[j][3] == sa[j][5] && sa[j][3] < lpx && sa[j][4] <= lpy && sa[j][6] >= lpy){
		      if(lpx - sa[j][3] < 100){
			  mn = Math.min(mn, lpx - sa[j][3]);
		      }
		  }
	      }
	      if(mn != Infinity){
		  sa[i][2] += 700 - Math.floor(mn / 15) * 100; // 0-99 -> 0-700
	      }
	  }
      }
      return sa;
  }
  Kage.prototype.adjustHane = adjustHane;

  function adjustUroko(strokesArray){ // strokesArray
    for(var i = 0; i < strokesArray.length; i++){
      if(strokesArray[i][0] == 1 && strokesArray[i][2] == 0){ // no operation for TATE
        for(var k = 0; k < this.kAdjustUrokoLengthStep; k++){
          var tx, ty, tlen;
          if(strokesArray[i][4] == strokesArray[i][6]){ // YOKO
            tx = strokesArray[i][5] - this.kAdjustUrokoLine[k];
            ty = strokesArray[i][6] - 0.5;
            tlen = strokesArray[i][5] - strokesArray[i][3];
          } else {
            var rad = Math.atan((strokesArray[i][6] - strokesArray[i][4]) / (strokesArray[i][5] - strokesArray[i][3]));
            tx = strokesArray[i][5] - this.kAdjustUrokoLine[k] * Math.cos(rad) - 0.5 * Math.sin(rad);
            ty = strokesArray[i][6] - this.kAdjustUrokoLine[k] * Math.sin(rad) - 0.5 * Math.cos(rad);
            tlen = Math.sqrt((strokesArray[i][6] - strokesArray[i][4]) * (strokesArray[i][6] - strokesArray[i][4]) +
                             (strokesArray[i][5] - strokesArray[i][3]) * (strokesArray[i][5] - strokesArray[i][3]));
          }
          if(tlen < this.kAdjustUrokoLength[k] ||
             isCrossWithOthers(strokesArray, i, tx, ty, strokesArray[i][5], strokesArray[i][6])
             ){
            strokesArray[i][2] += (this.kAdjustUrokoLengthStep - k) * 100;
            k = Infinity;
          }
        }
      }
    }
    return strokesArray;
  }
  Kage.prototype.adjustUroko = adjustUroko;
  
  function adjustUroko2(strokesArray){ // strokesArray
    for(var i = 0; i < strokesArray.length; i++){
      if(strokesArray[i][0] == 1 && strokesArray[i][2] == 0 && strokesArray[i][4] == strokesArray[i][6]){
        var pressure = 0;
        for(var j = 0; j < strokesArray.length; j++){
          if(i != j && (
             (strokesArray[j][0] == 1 && strokesArray[j][4] == strokesArray[j][6] &&
              !(strokesArray[i][3] + 1 > strokesArray[j][5] || strokesArray[i][5] - 1 < strokesArray[j][3]) &&
              Math.abs(strokesArray[i][4] - strokesArray[j][4]) < this.kAdjustUroko2Length) ||
             (strokesArray[j][0] == 3 && strokesArray[j][6] == strokesArray[j][8] &&
              !(strokesArray[i][3] + 1 > strokesArray[j][7] || strokesArray[i][5] - 1 < strokesArray[j][5]) &&
              Math.abs(strokesArray[i][4] - strokesArray[j][6]) < this.kAdjustUroko2Length)
             )){
            pressure += Math.pow(this.kAdjustUroko2Length - Math.abs(strokesArray[i][4] - strokesArray[j][6]), 1.1);
          }
        }
        var result = Math.min(Math.floor(pressure / this.kAdjustUroko2Length), this.kAdjustUroko2Step) * 100;
        if(strokesArray[i][2] < result){
          strokesArray[i][2] = strokesArray[i][2] % 100 + Math.min(Math.floor(pressure / this.kAdjustUroko2Length), this.kAdjustUroko2Step) * 100;
        }
      }
    }
    return strokesArray;
  }
  Kage.prototype.adjustUroko2 = adjustUroko2;
  
  function adjustTate(strokesArray){ // strokesArray
    for(var i = 0; i < strokesArray.length; i++){
      if((strokesArray[i][0] == 1 || strokesArray[i][0] == 3 || strokesArray[i][0] == 7) && strokesArray[i][3] == strokesArray[i][5]){
        for(var j = 0; j < strokesArray.length; j++){
          if(i != j && (strokesArray[j][0] == 1 || strokesArray[j][0] == 3 || strokesArray[j][0] == 7) && strokesArray[j][3] == strokesArray[j][5] &&
             !(strokesArray[i][4] + 1 > strokesArray[j][6] || strokesArray[i][6] - 1 < strokesArray[j][4]) &&
             Math.abs(strokesArray[i][3] - strokesArray[j][3]) < this.kMinWidthT * this.kAdjustTateStep){
            strokesArray[i][1] += (this.kAdjustTateStep - Math.floor(Math.abs(strokesArray[i][3] - strokesArray[j][3]) / this.kMinWidthT)) * 1000;
            if(strokesArray[i][1] > this.kAdjustTateStep * 1000){
              strokesArray[i][1] = strokesArray[i][1] % 1000 + this.kAdjustTateStep * 1000;
            }
          }
        }
      }
    }
    return strokesArray;
  }
  Kage.prototype.adjustTate = adjustTate;
  
  function adjustMage(strokesArray){ // strokesArray
    for(var i = 0; i < strokesArray.length; i++){
      if((strokesArray[i][0] == 3) && strokesArray[i][6] == strokesArray[i][8]){
        for(var j = 0; j < strokesArray.length; j++){
          if(i != j && (
             (strokesArray[j][0] == 1 && strokesArray[j][4] == strokesArray[j][6] &&
              !(strokesArray[i][5] + 1 > strokesArray[j][5] || strokesArray[i][7] - 1 < strokesArray[j][3]) &&
              Math.abs(strokesArray[i][6] - strokesArray[j][4]) < this.kMinWidthT * this.kAdjustMageStep) ||
             (strokesArray[j][0] == 3 && strokesArray[j][6] == strokesArray[j][8] &&
              !(strokesArray[i][5] + 1 > strokesArray[j][7] || strokesArray[i][7] - 1 < strokesArray[j][5]) &&
              Math.abs(strokesArray[i][6] - strokesArray[j][6]) < this.kMinWidthT * this.kAdjustMageStep)
             )){
            strokesArray[i][2] += (this.kAdjustMageStep - Math.floor(Math.abs(strokesArray[i][6] - strokesArray[j][6]) / this.kMinWidthT)) * 1000;
            if(strokesArray[i][2] > this.kAdjustMageStep * 1000){
              strokesArray[i][2] = strokesArray[i][2] % 1000 + this.kAdjustMageStep * 1000;
            }
          }
        }
      }
    }
    return strokesArray;
  }
  Kage.prototype.adjustMage = adjustMage;
  
  function adjustKirikuchi(strokesArray){ // strokesArray
    for(var i = 0; i < strokesArray.length; i++){
      if(strokesArray[i][0] == 2 && strokesArray[i][1] == 32 &&
         strokesArray[i][3] > strokesArray[i][5] &&
         strokesArray[i][4] < strokesArray[i][6]){
        for(var j = 0; j < strokesArray.length; j++){ // no need to skip when i == j
          if(strokesArray[j][0] == 1 &&
             strokesArray[j][3] < strokesArray[i][3] && strokesArray[j][5] > strokesArray[i][3] &&
             strokesArray[j][4] == strokesArray[i][4] && strokesArray[j][4] == strokesArray[j][6]){
            strokesArray[i][1] = 132;
            j = strokesArray.length;
          }
        }
      }
    }
    return strokesArray;
  }
  Kage.prototype.adjustKirikuchi = adjustKirikuchi;
  
  function adjustKakato(strokesArray){ // strokesArray
    for(var i = 0; i < strokesArray.length; i++){
      if(strokesArray[i][0] == 1 &&
         (strokesArray[i][2] == 13 || strokesArray[i][2] == 23)){
        for(var k = 0; k < this.kAdjustKakatoStep; k++){
          if(isCrossBoxWithOthers(strokesArray, i,
                               strokesArray[i][5] - this.kAdjustKakatoRangeX / 2,
                               strokesArray[i][6] + this.kAdjustKakatoRangeY[k],
                               strokesArray[i][5] + this.kAdjustKakatoRangeX / 2,
                               strokesArray[i][6] + this.kAdjustKakatoRangeY[k + 1])
             | strokesArray[i][6] + this.kAdjustKakatoRangeY[k + 1] > 200 // adjust for baseline
             | strokesArray[i][6] - strokesArray[i][4] < this.kAdjustKakatoRangeY[k + 1] // for thin box
             ){
            strokesArray[i][2] += (3 - k) * 100;
            k = Infinity;
          }
        }
      }
    }
    return strokesArray;
  }
  Kage.prototype.adjustKakato = adjustKakato;
  
  function getBox(glyph){ // minX, minY, maxX, maxY
      var a = new Object();
      a.minX = 200;
      a.minY = 200;
      a.maxX = 0;
      a.maxY = 0;
      
      var strokes = this.getEachStrokes(glyph);
      for(var i = 0; i < strokes.length; i++){
	  if(strokes[i][0] == 0){ continue; }
	  a.minX = Math.min(a.minX, strokes[i][3]);
	  a.maxX = Math.max(a.maxX, strokes[i][3]);
	  a.minY = Math.min(a.minY, strokes[i][4]);
	  a.maxY = Math.max(a.maxY, strokes[i][4]);
	  a.minX = Math.min(a.minX, strokes[i][5]);
	  a.maxX = Math.max(a.maxX, strokes[i][5]);
	  a.minY = Math.min(a.minY, strokes[i][6]);
	  a.maxY = Math.max(a.maxY, strokes[i][6]);
	  if(strokes[i][0] == 1){ continue; }
	  if(strokes[i][0] == 99){ continue; }
	  a.minX = Math.min(a.minX, strokes[i][7]);
	  a.maxX = Math.max(a.maxX, strokes[i][7]);
	  a.minY = Math.min(a.minY, strokes[i][8]);
	  a.maxY = Math.max(a.maxY, strokes[i][8]);
	  if(strokes[i][0] == 2){ continue; }
	  if(strokes[i][0] == 3){ continue; }
	  if(strokes[i][0] == 4){ continue; }
	  a.minX = Math.min(a.minX, strokes[i][9]);
	  a.maxX = Math.max(a.maxX, strokes[i][9]);
	  a.minY = Math.min(a.minY, strokes[i][10]);
	  a.maxY = Math.max(a.maxY, strokes[i][10]);
      }
      return a;
  }
  Kage.prototype.getBox = getBox;

  function stretch(dp, sp, p, min, max){ // interger
      var p1, p2, p3, p4;
      if(p < sp + 100){
	  p1 = min;
	  p3 = min;
	  p2 = sp + 100;
	  p4 = dp + 100;
      } else {
	  p1 = sp + 100;
	  p3 = dp + 100;
	  p2 = max;
	  p4 = max;
      }
      return Math.floor(((p - p1) / (p2 - p1)) * (p4 - p3) + p3);
  }
  Kage.prototype.stretch = stretch;

  //properties
  Kage.prototype.kMincho = 0;
  Kage.prototype.kGothic = 1;
  this.kShotai = this.kMincho;
  
  this.kRate = 100;
  
  if(size == 1){
    this.kMinWidthY = 1.2;
    this.kMinWidthT = 3.6;
    this.kWidth = 3;
    this.kKakato = 1.8;
    this.kL2RDfatten = 1.1;
    this.kMage = 6;
    this.kUseCurve = 0;
    
    this.kAdjustKakatoL = ([8, 5, 3, 1]); // for KAKATO adjustment 000,100,200,300
    this.kAdjustKakatoR = ([4, 3, 2, 1]); // for KAKATO adjustment 000,100,200,300
    this.kAdjustKakatoRangeX = 12; // check area width
    this.kAdjustKakatoRangeY = ([1, 11, 14, 18]); // 3 steps of checking
    this.kAdjustKakatoStep = 3; // number of steps
    
    this.kAdjustUrokoX = ([14, 12, 9, 7]); // for UROKO adjustment 000,100,200,300
    this.kAdjustUrokoY = ([7, 6, 5, 4]); // for UROKO adjustment 000,100,200,300
    this.kAdjustUrokoLength = ([13, 21, 30]); // length for checking
    this.kAdjustUrokoLengthStep = 3; // number of steps
    this.kAdjustUrokoLine = ([13, 15, 18]); // check for crossing. corresponds to length
  } else {
    this.kMinWidthY = 2;
    this.kMinWidthT = 6;
    this.kWidth = 5;
    this.kKakato = 3;
    this.kL2RDfatten = 1.1;
    this.kMage = 10;
    this.kUseCurve = 0;
    
    this.kAdjustKakatoL = ([14, 9, 5, 2]); // for KAKATO adjustment 000,100,200,300
    this.kAdjustKakatoR = ([8, 6, 4, 2]); // for KAKATO adjustment 000,100,200,300
    this.kAdjustKakatoRangeX = 20; // check area width
    this.kAdjustKakatoRangeY = ([1, 19, 24, 30]); // 3 steps of checking
    this.kAdjustKakatoStep = 3; // number of steps
    
    this.kAdjustUrokoX = ([24, 20, 16, 12]); // for UROKO adjustment 000,100,200,300
    this.kAdjustUrokoY = ([12, 11, 9, 8]); // for UROKO adjustment 000,100,200,300
    this.kAdjustUrokoLength = ([22, 36, 50]); // length for checking
    this.kAdjustUrokoLengthStep = 3; // number of steps
    this.kAdjustUrokoLine = ([22, 26, 30]); // check for crossing. corresponds to length
    
    this.kAdjustUroko2Step = 3;
    this.kAdjustUroko2Length = 40;
    
    this.kAdjustTateStep = 4;
    
    this.kAdjustMageStep = 5;
  }
  
  this.kBuhin = new Buhin();
  
  return this;
}
function cdDrawCurveU(kage, polygons, x1, y1, sx1, sy1, sx2, sy2, x2, y2, ta1, ta2){
  var rad, t;
  var x, y, v;
  var ix, iy, ia, ib, ir;
  var tt;
  var delta;
  var deltad;
  var XX, XY, YX, YY;
  var poly, poly2;
  var hosomi;
  var kMinWidthT, kMinWidthT2;
  var a1, a2, opt1, opt2, opt3, opt4;
  
  if(kage.kShotai == kage.kMincho){ // mincho
    a1 = ta1 % 1000;
    a2 = ta2 % 100;
    opt1 = Math.floor((ta1 % 10000) / 1000);
    opt2 = Math.floor((ta2 % 1000) / 100);
    opt3 = Math.floor(ta1 / 10000);
    opt4 = Math.floor(ta2 / 1000);
    
    kMinWidthT = kage.kMinWidthT - opt1 / 2;
    kMinWidthT2 = kage.kMinWidthT - opt4 / 2;
    
    switch(a1 % 100){
    case 0:
    case 7:
      delta = -1 * kage.kMinWidthY * 0.5;
      break;
    case 1:
    case 2: // ... must be 32
    case 6:
    case 22:
    case 32: // changed
      delta = 0;
      break;
    case 12:
    //case 32:
      delta = kage.kMinWidthY;
      break;
    default:
      break;
    }
    
    if(x1 == sx1){
      if(y1 < sy1){ y1 = y1 - delta; }
      else{ y1 = y1 + delta; }
    }
    else if(y1 == sy1){
      if(x1 < sx1){ x1 = x1 - delta; }
      else{ x1 = x1 + delta; }
    }
    else{
      rad = Math.atan((sy1 - y1) / (sx1 - x1));
      if(x1 < sx1){ v = 1; } else{ v = -1; }
      x1 = x1 - delta * Math.cos(rad) * v;
      y1 = y1 - delta * Math.sin(rad) * v;
    }
    
    switch(a2 % 100){
    case 0:
    case 1:
    case 7:
    case 9:
    case 15: // it can change to 15->5
    case 14: // it can change to 14->4
    case 17: // no need
    case 5:
      delta = 0;
      break;
    case 8: // get shorten for tail's circle
      delta = -1 * kMinWidthT * 0.5;
      break;
    default:
      break;
    }
    
    if(sx2 == x2){
      if(sy2 < y2){ y2 = y2 + delta; }
      else{ y2 = y2 - delta; }
    }
    else if(sy2 == y2){
      if(sx2 < x2){ x2 = x2 + delta; }
      else{ x2 = x2 - delta; }
    }
    else{
      rad = Math.atan((y2 - sy2) / (x2 - sx2));
      if(sx2 < x2){ v = 1; } else{ v = -1; }
      x2 = x2 + delta * Math.cos(rad) * v;
      y2 = y2 + delta * Math.sin(rad) * v;
    }
    
    hosomi = 0.5;
    if(Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) < 50){
      hosomi += 0.4 * (1 - Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) / 50);
    }
    
    //---------------------------------------------------------------
    
    poly = new Polygon();
    poly2 = new Polygon();
    
    if(sx1 == sx2 && sy1 == sy2){ // Spline
      if(kage.kUseCurve){
        // generating fatten curve -- begin
        var kage2 = new Kage();
        kage2.kMinWidthY = kage.kMinWidthY;
        kage2.kMinWidthT = kMinWidthT;
        kage2.kWidth = kage.kWidth;
        kage2.kKakato = kage.kKakato;
        kage2.kRate = 10;
        
        var curve = new Array(2); // L and R
        get_candidate(kage2, curve, a1, a2, x1, y1, sx1, sy1, x2, y2, opt3, opt4);
        
        var dcl12_34 = new Array(2);
        var dcr12_34 = new Array(2);
        var dpl12_34 = new Array(2);
        var dpr12_34 = new Array(2);
        divide_curve(kage2, x1, y1, sx1, sy1, x2, y2, curve[0], dcl12_34, dpl12_34);
        divide_curve(kage2, x1, y1, sx1, sy1, x2, y2, curve[1], dcr12_34, dpr12_34);
        
        var ncl1 = new Array(7);
        var ncl2 = new Array(7);
        find_offcurve(kage2, dcl12_34[0], dpl12_34[0][2], dpl12_34[0][3], ncl1);
        find_offcurve(kage2, dcl12_34[1], dpl12_34[1][2], dpl12_34[1][3], ncl2);
        
        poly.push(ncl1[0], ncl1[1]);
        poly.push(ncl1[2], ncl1[3], 1);
        poly.push(ncl1[4], ncl1[5]);
        poly.push(ncl2[2], ncl2[3], 1);
        poly.push(ncl2[4], ncl2[5]);
        
        poly2.push(dcr12_34[0][0][0], dcr12_34[0][0][1]);
        poly2.push(dpr12_34[0][2] - (ncl1[2] - dpl12_34[0][2]), dpl12_34[0][3] - (ncl1[3] - dpl12_34[0][3]), 1);
        poly2.push(dcr12_34[0][dcr12_34[0].length - 1][0], dcr12_34[0][dcr12_34[0].length - 1][1]);
        poly2.push(dpr12_34[1][2] - (ncl2[2] - dpl12_34[1][2]), dpl12_34[1][3] - (ncl2[3] - dpl12_34[1][3]), 1);
        poly2.push(dcr12_34[1][dcr12_34[1].length - 1][0], dcr12_34[1][dcr12_34[1].length - 1][1]);
        
        poly2.reverse();
        poly.concat(poly2);
        polygons.push(poly);
        // generating fatten curve -- end
      } else {
        for(tt = 0; tt <= 1000; tt = tt + kage.kRate){
          t = tt / 1000;
          
          // calculate a dot
          x = ((1.0 - t) * (1.0 - t) * x1 + 2.0 * t * (1.0 - t) * sx1 + t * t * x2);
          y = ((1.0 - t) * (1.0 - t) * y1 + 2.0 * t * (1.0 - t) * sy1 + t * t * y2);
          
          // KATAMUKI of vector by BIBUN
          ix = (x1 - 2.0 * sx1 + x2) * 2.0 * t + (-2.0 * x1 + 2.0 * sx1);
          iy = (y1 - 2.0 * sy1 + y2) * 2.0 * t + (-2.0 * y1 + 2.0 * sy1);
          
          // line SUICHOKU by vector
          if(ix != 0 && iy != 0){
            ir = Math.atan(iy / ix * -1);
            ia = Math.sin(ir) * (kMinWidthT);
            ib = Math.cos(ir) * (kMinWidthT);
          }
          else if(ix == 0){
            ia = kMinWidthT;
            ib = 0;
          }
          else{
            ia = 0;
            ib = kMinWidthT;
          }
          
          if(a1 == 7 && a2 == 0){ // L2RD: fatten
            deltad = Math.pow(t, hosomi) * kage.kL2RDfatten;
          }
          else if(a1 == 7){
            deltad = Math.pow(t, hosomi);
          }
          else if(a2 == 7){
            deltad = Math.pow(1.0 - t, hosomi);
          }
          else if(opt3 > 0 || opt4 > 0){
              deltad = ((kage.kMinWidthT - opt3 / 2) - (opt4 - opt3) / 2 * t) / kage.kMinWidthT;
          }
          else{ deltad = 1; }
          
          if(deltad < 0.15){
            deltad = 0.15;
          }
          ia = ia * deltad;
          ib = ib * deltad;
          
          //reverse if vector is going 2nd/3rd quadrants
          if(ix <= 0){
            ia = ia * -1;
            ib = ib * -1;
          }
          
          //copy to polygon structure
          poly.push(x - ia, y - ib);
          poly2.push(x + ia, y + ib);
        }
        
        // suiheisen ni setsuzoku
        if(a1 == 132){
          var index = 0;
          while(true){
            if(poly2.array[index].y <= y1 && y1 <= poly2.array[index + 1].y){
              break;
            }
            index++;
          }
          newx1 = poly2.array[index + 1].x + (poly2.array[index].x - poly2.array[index + 1].x) *
            (poly2.array[index + 1].y - y1) / (poly2.array[index + 1].y - poly2.array[index].y);
          newy1 = y1;
          newx2 = poly.array[0].x + (poly.array[0].x - poly.array[1].x) * (poly.array[0].y - y1) /
            (poly.array[1].y - poly.array[0].y);
          newy2 = y1;
          
          for(var i = 0; i < index; i++){
            poly2.shift();
          }
          poly2.set(0, newx1, newy1);
          poly.unshift(newx2, newy2);
        }
        
        // suiheisen ni setsuzoku 2
        if(a1 == 22 && y1 > y2){
          var index = 0;
          while(true){
            if(poly2.array[index].y <= y1 && y1 <= poly2.array[index + 1].y){
              break;
            }
            index++;
          }
          newx1 = poly2.array[index + 1].x + (poly2.array[index].x - poly2.array[index + 1].x) *
            (poly2.array[index + 1].y - y1) / (poly2.array[index + 1].y - poly2.array[index].y);
          newy1 = y1;
          newx2 = poly.array[0].x + (poly.array[0].x - poly.array[1].x - 1) * (poly.array[0].y - y1) /
            (poly.array[1].y - poly.array[0].y);
          newy2 = y1 + 1;
          
          for(var i = 0; i < index; i++){
            poly2.shift();
          }
          poly2.set(0, newx1, newy1);
          poly.unshift(newx2, newy2);
        }
        
        poly2.reverse();
        poly.concat(poly2);
        polygons.push(poly);
      }
    } else { // Bezier
      for(tt = 0; tt <= 1000; tt = tt + kage.kRate){
        t = tt / 1000;
        
        // calculate a dot
        x = (1.0 - t) * (1.0 - t) * (1.0 - t) * x1 + 3.0 * t * (1.0 - t) * (1.0 - t) * sx1 + 3 * t * t * (1.0 - t) * sx2 + t * t * t * x2;
        y = (1.0 - t) * (1.0 - t) * (1.0 - t) * y1 + 3.0 * t * (1.0 - t) * (1.0 - t) * sy1 + 3 * t * t * (1.0 - t) * sy2 + t * t * t * y2;
        // KATAMUKI of vector by BIBUN
        ix = t * t * (-3 * x1 + 9 * sx1 + -9 * sx2 + 3 * x2) + t * (6 * x1 + -12 * sx1 + 6 * sx2) + -3 * x1 + 3 * sx1;
        iy = t * t * (-3 * y1 + 9 * sy1 + -9 * sy2 + 3 * y2) + t * (6 * y1 + -12 * sy1 + 6 * sy2) + -3 * y1 + 3 * sy1;
        
        // line SUICHOKU by vector
        if(ix != 0 && iy != 0){
          ir = Math.atan(iy / ix * -1);
          ia = Math.sin(ir) * (kMinWidthT);
          ib = Math.cos(ir) * (kMinWidthT);
        }
        else if(ix == 0){
          ia = kMinWidthT;
          ib = 0;
        }
        else{
          ia = 0;
          ib = kMinWidthT;
        }
        
        if(a1 == 7 && a2 == 0){ // L2RD: fatten
          deltad = Math.pow(t, hosomi) * kage.kL2RDfatten;
        }
        else if(a1 == 7){
          deltad = Math.pow(t, hosomi);
          deltad = Math.pow(deltad, 0.7); // make fatten
        }
        else if(a2 == 7){
          deltad = Math.pow(1.0 - t, hosomi);
        }
        else{ deltad = 1; }
        
        if(deltad < 0.15){
          deltad = 0.15;
        }
        ia = ia * deltad;
        ib = ib * deltad;
        
        //reverse if vector is going 2nd/3rd quadrants
        if(ix <= 0){
          ia = ia * -1;
          ib = ib * -1;
        }
        
        //copy to polygon structure
        poly.push(x - ia, y - ib);
        poly2.push(x + ia, y + ib);
      }
      
      // suiheisen ni setsuzoku
      if(a1 == 132){
        var index = 0;
        while(true){
          if(poly2.array[index].y <= y1 && y1 <= poly2.array[index + 1].y){
            break;
          }
          index++;
        }
        newx1 = poly2.array[index + 1].x + (poly2.array[index].x - poly2.array[index + 1].x) *
          (poly2.array[index + 1].y - y1) / (poly2.array[index + 1].y - poly2.array[index].y);
        newy1 = y1;
        newx2 = poly.array[0].x + (poly.array[0].x - poly.array[1].x) * (poly.array[0].y - y1) /
          (poly.array[1].y - poly.array[0].y);
        newy2 = y1;
        
        for(var i = 0; i < index; i++){
          poly2.shift();
        }
        poly2.set(0, newx1, newy1);
        poly.unshift(newx2, newy2);
      }
      
      // suiheisen ni setsuzoku 2
      if(a1 == 22){
        var index = 0;
        while(true){
          if(poly2.array[index].y <= y1 && y1 <= poly2.array[index + 1].y){
            break;
          }
          index++;
        }
        newx1 = poly2.array[index + 1].x + (poly2.array[index].x - poly2.array[index + 1].x) *
          (poly2.array[index + 1].y - y1) / (poly2.array[index + 1].y - poly2.array[index].y);
        newy1 = y1;
        newx2 = poly.array[0].x + (poly.array[0].x - poly.array[1].x - 1) * (poly.array[0].y - y1) /
          (poly.array[1].y - poly.array[0].y);
        newy2 = y1 + 1;
        
        for(var i = 0; i < index; i++){
          poly2.shift();
        }
        poly2.set(0, newx1, newy1);
        poly.unshift(newx2, newy2);
      }
      
      poly2.reverse();
      poly.concat(poly2);
      polygons.push(poly);
    }
    
    //process for head of stroke
    rad = Math.atan((sy1 - y1) / (sx1 - x1));
    if(x1 < sx1){ v = 1; } else{ v = -1; }
    XX = Math.sin(rad) * v;
    XY = Math.cos(rad) * v * -1;
    YX = Math.cos(rad) * v;
    YY = Math.sin(rad) * v;
    
    if(a1 == 12){
      if(x1 == x2){
        poly= new Polygon();
        poly.push(x1 - kMinWidthT, y1);
        poly.push(x1 + kMinWidthT, y1);
        poly.push(x1 - kMinWidthT, y1 - kMinWidthT);
        polygons.push(poly);
      }
      else{
        poly = new Polygon();
        poly.push(x1 - kMinWidthT * XX, y1 - kMinWidthT * XY);
        poly.push(x1 + kMinWidthT * XX, y1 + kMinWidthT * XY);
        poly.push(x1 - kMinWidthT * XX - kMinWidthT * YX, y1 - kMinWidthT * XY - kMinWidthT * YY);
        polygons.push(poly);
      }
    }
    
    var type;
    var pm = 0;
    if(a1 == 0){
      if(y1 <= y2){ //from up to bottom
        type = (Math.atan2(Math.abs(y1 - sy1), Math.abs(x1 - sx1)) / Math.PI * 2 - 0.4);
        if(type > 0){
          type = type * 2;
        } else {
          type = type * 16;
        }
        if(type < 0){
          pm = -1;
        } else {
          pm = 1;
        }
        if(x1 == sx1){
          poly = new Polygon();
          poly.push(x1 - kMinWidthT, y1 + 1);
          poly.push(x1 + kMinWidthT, y1);
          poly.push(x1 - kMinWidthT * pm, y1 - kage.kMinWidthY * type * pm);
          //if(x1 > x2){
          //  poly.reverse();
          //}
          polygons.push(poly);
        }
        else{
          poly = new Polygon();
          poly.push(x1 - kMinWidthT * XX + 1 * YX, y1 - kMinWidthT * XY + 1 * YY);
          poly.push(x1 + kMinWidthT * XX, y1 + kMinWidthT * XY);
          poly.push(x1 - kMinWidthT * pm * XX - kage.kMinWidthY * type * pm * YX, y1 - kMinWidthT * pm * XY - kage.kMinWidthY * type * pm * YY);
          //if(x1 > x2){
          //  poly.reverse();
          //}
          polygons.push(poly);
        }
      }
      else{ //bottom to up
        if(x1 == sx1){
          poly = new Polygon();
          poly.push(x1 - kMinWidthT, y1);
          poly.push(x1 + kMinWidthT, y1);
          poly.push(x1 + kMinWidthT, y1 - kage.kMinWidthY);
          polygons.push(poly);
        }
        else{
          poly = new Polygon();
          poly.push(x1 - kMinWidthT * XX, y1 - kMinWidthT * XY);
          poly.push(x1 + kMinWidthT * XX, y1 + kMinWidthT * XY);
          poly.push(x1 + kMinWidthT * XX - kage.kMinWidthY * YX, y1 + kMinWidthT * XY - kage.kMinWidthY * YY);
          //if(x1 < x2){
          //  poly.reverse();
          //}
          polygons.push(poly);
        }
      }
    }
    
    if(a1 == 22){ //box's up-right corner, any time same degree
      poly = new Polygon();
      poly.push(x1 - kMinWidthT, y1 - kage.kMinWidthY);
      poly.push(x1, y1 - kage.kMinWidthY - kage.kWidth);
      poly.push(x1 + kMinWidthT + kage.kWidth, y1 + kage.kMinWidthY);
      poly.push(x1 + kMinWidthT, y1 + kMinWidthT - 1);
      poly.push(x1 - kMinWidthT, y1 + kMinWidthT + 4);
      polygons.push(poly);
    }
    
    if(a1 == 0){ //beginning of the stroke
      if(y1 <= y2){ //from up to bottom
        if(pm > 0){
          type = 0;
        }
        var move = kage.kMinWidthY * type * pm;
        if(x1 == sx1){
          poly = new Polygon();
          poly.push(x1 + kMinWidthT, y1 - move);
          poly.push(x1 + kMinWidthT * 1.5, y1 + kage.kMinWidthY - move);
          poly.push(x1 + kMinWidthT - 2, y1 + kage.kMinWidthY * 2 + 1);
          polygons.push(poly);
        }
        else{
          poly = new Polygon();
          poly.push(x1 + kMinWidthT * XX - move * YX,
                    y1 + kMinWidthT * XY - move * YY);
          poly.push(x1 + kMinWidthT * 1.5 * XX + (kage.kMinWidthY - move * 1.2) * YX,
                    y1 + kMinWidthT * 1.5 * XY + (kage.kMinWidthY - move * 1.2) * YY);
          poly.push(x1 + (kMinWidthT - 2) * XX + (kage.kMinWidthY * 2 - move * 0.8 + 1) * YX,
                    y1 + (kMinWidthT - 2) * XY + (kage.kMinWidthY * 2 - move * 0.8 + 1) * YY);
          //if(x1 < x2){
          //  poly.reverse();
          //}
          polygons.push(poly);
        }
      }
      else{ //from bottom to up
        if(x1 == sx1){
          poly = new Polygon();
          poly.push(x1 - kMinWidthT, y1);
          poly.push(x1 - kMinWidthT * 1.5, y1 + kage.kMinWidthY);
          poly.push(x1 - kMinWidthT * 0.5, y1 + kage.kMinWidthY * 3);
          polygons.push(poly);
        }
        else{
          poly = new Polygon();
          poly.push(x1 - kMinWidthT * XX, y1 - kMinWidthT * XY);
          poly.push(x1 - kMinWidthT * 1.5 * XX + kage.kMinWidthY * YX, y1 + kage.kMinWidthY * YY - kMinWidthT * 1.5 * XY);
          poly.push(x1 - kMinWidthT * 0.5 * XX + kage.kMinWidthY * 3 * YX, y1 + kage.kMinWidthY * 3 * YY - kMinWidthT * 0.5 * XY);
          //if(x1 < x2){
          //  poly.reverse();
          //}
          polygons.push(poly);
        }
      }
    }
    
    //process for tail
    rad = Math.atan((y2 - sy2) / (x2 - sx2));
    if(sx2 < x2){ v = 1; } else{ v = -1; }
    YX = Math.sin(rad) * v * -1;
    YY = Math.cos(rad) * v;
    XX = Math.cos(rad) * v;
    XY = Math.sin(rad) * v;
    
    if(a2 == 1 || a2 == 8 || a2 == 15){ //the last filled circle ... it can change 15->5
      if(sx2 == x2){
        poly = new Polygon();
        if(kage.kUseCurve){
          // by curve path
          poly.push(x2 - kMinWidthT2, y2);
          poly.push(x2 - kMinWidthT2 * 0.9, y2 + kMinWidthT2 * 0.9, 1);
          poly.push(x2, y2 + kMinWidthT2);
          poly.push(x2 + kMinWidthT2 * 0.9, y2 + kMinWidthT2 * 0.9, 1);
          poly.push(x2 + kMinWidthT2, y2);
        } else {
          // by polygon
          poly.push(x2 - kMinWidthT2, y2);
          poly.push(x2 - kMinWidthT2 * 0.7, y2 + kMinWidthT2 * 0.7);
          poly.push(x2, y2 + kMinWidthT2);
          poly.push(x2 + kMinWidthT2 * 0.7, y2 + kMinWidthT2 * 0.7);
          poly.push(x2 + kMinWidthT2, y2);
        }
        polygons.push(poly);
      }
      else if(sy2 == y2){
        poly = new Polygon();
        if(kage.kUseCurve){
          // by curve path
          poly.push(x2, y2 - kMinWidthT2);
          poly.push(x2 + kMinWidthT2 * 0.9, y2 - kMinWidthT2 * 0.9, 1);
          poly.push(x2 + kMinWidthT2, y2);
          poly.push(x2 + kMinWidthT2 * 0.9, y2 + kMinWidthT2 * 0.9, 1);
          poly.push(x2, y2 + kMinWidthT2);
        } else {
          // by polygon
          poly.push(x2, y2 - kMinWidthT2);
          poly.push(x2 + kMinWidthT2 * 0.7, y2 - kMinWidthT2 * 0.7);
          poly.push(x2 + kMinWidthT2, y2);
          poly.push(x2 + kMinWidthT2 * 0.7, y2 + kMinWidthT2 * 0.7);
          poly.push(x2, y2 + kMinWidthT2);
        }
        polygons.push(poly);
      }
      else{
        poly = new Polygon();
        if(kage.kUseCurve){
          poly.push(x2 + Math.sin(rad) * kMinWidthT2 * v, y2 - Math.cos(rad) * kMinWidthT2 * v);
          poly.push(x2 + Math.cos(rad) * kMinWidthT2 * 0.9 * v + Math.sin(rad) * kMinWidthT2 * 0.9 * v,
                    y2 + Math.sin(rad) * kMinWidthT2 * 0.9 * v - Math.cos(rad) * kMinWidthT2 * 0.9 * v, 1);
          poly.push(x2 + Math.cos(rad) * kMinWidthT2 * v, y2 + Math.sin(rad) * kMinWidthT2 * v);
          poly.push(x2 + Math.cos(rad) * kMinWidthT2 * 0.9 * v - Math.sin(rad) * kMinWidthT2 * 0.9 * v,
                    y2 + Math.sin(rad) * kMinWidthT2 * 0.9 * v + Math.cos(rad) * kMinWidthT2 * 0.9 * v, 1);
          poly.push(x2 - Math.sin(rad) * kMinWidthT2 * v, y2 + Math.cos(rad) * kMinWidthT2 * v);
        } else {
          poly.push(x2 + Math.sin(rad) * kMinWidthT2 * v, y2 - Math.cos(rad) * kMinWidthT2 * v);
          poly.push(x2 + Math.cos(rad) * kMinWidthT2 * 0.7 * v + Math.sin(rad) * kMinWidthT2 * 0.7 * v,
                    y2 + Math.sin(rad) * kMinWidthT2 * 0.7 * v - Math.cos(rad) * kMinWidthT2 * 0.7 * v);
          poly.push(x2 + Math.cos(rad) * kMinWidthT2 * v, y2 + Math.sin(rad) * kMinWidthT2 * v);
          poly.push(x2 + Math.cos(rad) * kMinWidthT2 * 0.7 * v - Math.sin(rad) * kMinWidthT2 * 0.7 * v,
                    y2 + Math.sin(rad) * kMinWidthT2 * 0.7 * v + Math.cos(rad) * kMinWidthT2 * 0.7 * v);
          poly.push(x2 - Math.sin(rad) * kMinWidthT2 * v, y2 + Math.cos(rad) * kMinWidthT2 * v);
        }
        polygons.push(poly);
      }
    }
    
    if(a2 == 9 || (a1 == 7 && a2 == 0)){ // Math.sinnyu & L2RD Harai ... no need for a2=9
      var type = (Math.atan2(Math.abs(y2 - sy2), Math.abs(x2 - sx2)) / Math.PI * 2 - 0.6);
      if(type > 0){
        type = type * 8;
      } else {
        type = type * 3;
      }
      var pm = 0;
      if(type < 0){
        pm = -1;
      } else {
        pm = 1;
      }
      if(sy2 == y2){
        poly = new Polygon();
        poly.push(x2, y2 + kMinWidthT * kage.kL2RDfatten);
        poly.push(x2, y2 - kMinWidthT * kage.kL2RDfatten);
        poly.push(x2 + kMinWidthT * kage.kL2RDfatten * Math.abs(type), y2 + kMinWidthT * kage.kL2RDfatten * pm);
        polygons.push(poly);
      }
      else{
        poly = new Polygon();
        poly.push(x2 + kMinWidthT * kage.kL2RDfatten * YX, y2 + kMinWidthT * kage.kL2RDfatten * YY);
        poly.push(x2 - kMinWidthT * kage.kL2RDfatten * YX, y2 - kMinWidthT * kage.kL2RDfatten * YY);
        poly.push(x2 + kMinWidthT * kage.kL2RDfatten * Math.abs(type) * XX + kMinWidthT * kage.kL2RDfatten * pm * YX,
                  y2 + kMinWidthT * kage.kL2RDfatten * Math.abs(type) * XY + kMinWidthT * kage.kL2RDfatten * pm * YY);
        polygons.push(poly);
      }
    }
    
    if(a2 == 15){ //jump up ... it can change 15->5
      // anytime same degree
      poly = new Polygon();
      if(y1 < y2){
        poly.push(x2, y2 - kMinWidthT + 1);
        poly.push(x2 + 2, y2 - kMinWidthT - kage.kWidth * 5);
        poly.push(x2, y2 - kMinWidthT - kage.kWidth * 5);
        poly.push(x2 - kMinWidthT, y2 - kMinWidthT + 1);
      } else {
        poly.push(x2, y2 + kMinWidthT - 1);
        poly.push(x2 - 2, y2 + kMinWidthT + kage.kWidth * 5);
        poly.push(x2, y2 + kMinWidthT + kage.kWidth * 5);
        poly.push(x2 + kMinWidthT, y2 + kMinWidthT - 1);
      }
      polygons.push(poly);
    }
    
    if(a2 == 14){ //jump to left, allways go left
      poly = new Polygon();
      poly.push(x2, y2);
      poly.push(x2, y2 - kMinWidthT);
      poly.push(x2 - kage.kWidth * 4 * Math.min(1 - opt2 / 10, Math.pow(kMinWidthT / kage.kMinWidthT, 3)), y2 - kMinWidthT);
      poly.push(x2 - kage.kWidth * 4 * Math.min(1 - opt2 / 10, Math.pow(kMinWidthT / kage.kMinWidthT, 3)), y2 - kMinWidthT * 0.5);
      //poly.reverse();
      polygons.push(poly);
    }
  }
  else{ //gothic
    if(a1 % 10 == 2){
      if(x1 == sx1){
        if(y1 < sy1){ y1 = y1 - kage.kWidth; } else{ y1 = y1 + kage.kWidth; }
      }
      else if(y1 == sy1){
        if(x1 < sx1){ x1 = x1 - kage.kWidth; } else{ x1 = x1 + kage.kWidth; }
      }
      else{
        rad = Math.atan((sy1 - y1) / (sx1 - x1));
        if(x1 < sx1){ v = 1; } else{ v = -1; }
        x1 = x1 - kage.kWidth * Math.cos(rad) * v;
        y1 = y1 - kage.kWidth * Math.sin(rad) * v;
      }
    }
    
    if(a1 % 10 == 3){
      if(x1 == sx1){
        if(y1 < sy1){
          y1 = y1 - kage.kWidth * kage.kKakato;
        }
        else{
          y1 = y1 + kage.kWidth * kage.kKakato;
        }
      }
      else if(y1 == sy1){
        if(x1 < sx1){
          x1 = x1 - kage.kWidth * kage.kKakato;
        }
        else{
          x1 = x1 + kage.kWidth * kage.kKakato;
        }
      }
      else{
        rad = Math.atan((sy1 - y1) / (sx1 - x1));
        if(x1 < sx1){ v = 1; } else{ v = -1; }
        x1 = x1 - kage.kWidth * Math.cos(rad) * v * kage.kKakato;
        y1 = y1 - kage.kWidth * Math.sin(rad) * v * kage.kKakato;
      }
    }
    if(a2 % 10 == 2){
      if(sx2 == x2){
        if(sy2 < y2){ y2 = y2 + kage.kWidth; } else{ y2 = y2 - kage.kWidth; }
      }
      else if(sy2 == y2){
        if(sx2 < x2){ x2 = x2 + kage.kWidth; } else{ x2 = x2 - kage.kWidth; }
      }
      else{
        rad = Math.atan((y2 - sy2) / (x2 - sx2));
        if(sx2 < x2){ v = 1; } else{ v = -1; }
        x2 = x2 + kage.kWidth * Math.cos(rad) * v;
        y2 = y2 + kage.kWidth * Math.sin(rad) * v;
      }
    }
    
    if(a2 % 10 == 3){
      if(sx2 == x2){
        if(sy2 < y2){
          y2 = y2 + kage.kWidth * kage.kKakato;
        }
        else{
          y2 = y2 - kage.kWidth * kage.kKakato;
        }
      }
      else if(sy2 == y2){
        if(sx2 < x2){
          x2 = x2 + kage.kWidth * kage.kKakato;
        }
        else{
          x2 = x2 - kage.kWidth * kage.kKakato;
        }
      }
      else{
        rad = Math.atan((y2 - sy2) / (x2 - sx2));
        if(sx2 < x2){ v = 1; } else{ v = -1; }
        x2 = x2 + kage.kWidth * Math.cos(rad) * v * kage.kKakato;
        y2 = y2 + kage.kWidth * Math.sin(rad) * v * kage.kKakato;
      }
    }
    
    poly = new Polygon();
    poly2 = new Polygon();
    
    for(tt = 0; tt <= 1000; tt = tt + kage.kRate){
      t = tt / 1000;
      
      if(sx1 == sx2 && sy1 == sy2){
        //calculating each point
        x = ((1.0 - t) * (1.0 - t) * x1 + 2.0 * t * (1.0 - t) * sx1 + t * t * x2);
        y = ((1.0 - t) * (1.0 - t) * y1 + 2.0 * t * (1.0 - t) * sy1 + t * t * y2);
        
        //SESSEN NO KATAMUKI NO KEISAN(BIBUN)
        ix = (x1 - 2.0 * sx1 + x2) * 2.0 * t + (-2.0 * x1 + 2.0 * sx1);
        iy = (y1 - 2.0 * sy1 + y2) * 2.0 * t + (-2.0 * y1 + 2.0 * sy1);
      } else {
      }
      //SESSEN NI SUICHOKU NA CHOKUSEN NO KEISAN
      if(kage.kShotai == kage.kMincho){ //always false ?
        if(ix != 0 && iy != 0){
          ir = Math.atan(iy / ix * -1.0);
          ia = Math.sin(ir) * kage.kMinWidthT;
          ib = Math.cos(ir) * kage.kMinWidthT;
        }
        else if(ix == 0){
          ia = kage.kMinWidthT;
          ib = 0;
        }
        else{
          ia = 0;
          ib = kage.kMinWidthT;
        }
        ia = ia * Math.sqrt(1.0 - t);
        ib = ib * Math.sqrt(1.0 - t);
      }
      else{
        if(ix != 0 && iy != 0){
          ir = Math.atan(iy / ix * -1.0);
          ia = Math.sin(ir) * kage.kWidth;
          ib = Math.cos(ir) * kage.kWidth;
        }
        else if(ix == 0){
          ia = kage.kWidth;
          ib = 0;
        }
        else{
          ia = 0;
          ib = kage.kWidth;
        }
      }
      
      //reverse if vector is going 2nd/3rd quadrants
      if(ix <= 0){
        ia = ia * -1;
        ib = ib * -1;
      }
      
      //save to polygon
      poly.push(x - ia, y - ib);
      poly2.push(x + ia, y + ib);
    }
    
    poly2.reverse();
    poly.concat(poly2);
    polygons.push(poly);
  }
}

function cdDrawBezier(kage, polygons, x1, y1, x2, y2, x3, y3, x4, y4, a1, a2){
  cdDrawCurveU(kage, polygons, x1, y1, x2, y2, x3, y3, x4, y4, a1, a2);
}

function cdDrawCurve(kage, polygons, x1, y1, x2, y2, x3, y3, a1, a2){
  cdDrawCurveU(kage, polygons, x1, y1, x2, y2, x2, y2, x3, y3, a1, a2);
}

function cdDrawLine(kage, polygons, tx1, ty1, tx2, ty2, ta1, ta2){
  var rad;
  var v, x1, y1, x2, y2;
  var a1, a2, opt1, opt2;
  var XX, XY, YX, YY;
  var poly;
  var kMinWidthT;
  
  if(kage.kShotai == kage.kMincho){ //mincho
    x1 = tx1;
    y1 = ty1;
    x2 = tx2;
    y2 = ty2;
    a1 = ta1 % 1000;
    a2 = ta2 % 100;
    opt1 = Math.floor(ta1 / 1000);
    opt2 = Math.floor(ta2 / 100);
    
    kMinWidthT = kage.kMinWidthT - opt1 / 2;
    
    if(x1 == x2){ //if TATE stroke, use y-axis
      poly = new Polygon(4);
      switch(a1){
      case 0:
        poly.set(3, x1 - kMinWidthT, y1 - kage.kMinWidthY / 2);
        poly.set(0, x1 + kMinWidthT, y1 + kage.kMinWidthY / 2);
        break;
      case 1:
      case 6: //... no need
      case 22:
        poly.set(3, x1 - kMinWidthT, y1);
        poly.set(0, x1 + kMinWidthT, y1);
        break;
      case 12:
        poly.set(3, x1 - kMinWidthT, y1 - kage.kMinWidthY - kMinWidthT);
        poly.set(0, x1 + kMinWidthT, y1 - kage.kMinWidthY);
        break;
      case 32:
        poly.set(3, x1 - kMinWidthT, y1 - kage.kMinWidthY);
        poly.set(0, x1 + kMinWidthT, y1 - kage.kMinWidthY);
        break;
      }
      
      switch(a2){
      case 0:
        if(a1 == 6){ //KAGI's tail ... no need
          poly.set(2, x2 - kMinWidthT, y2);
          poly.set(1, x2 + kMinWidthT, y2);
        }
        else{
          poly.set(2, x2 - kMinWidthT, y2 + kMinWidthT / 2);
          poly.set(1, x2 + kMinWidthT, y2 - kMinWidthT / 2);
        }
        break;
      case 1:
        poly.set(2, x2 - kMinWidthT, y2);
        poly.set(1, x2 + kMinWidthT, y2);
        break;
      case 13:
        poly.set(2, x2 - kMinWidthT, y2 + kage.kAdjustKakatoL[opt2] + kMinWidthT);
        poly.set(1, x2 + kMinWidthT, y2 + kage.kAdjustKakatoL[opt2]);
        break;
      case 23:
        poly.set(2, x2 - kMinWidthT, y2 + kage.kAdjustKakatoR[opt2] + kMinWidthT);
        poly.set(1, x2 + kMinWidthT, y2 + kage.kAdjustKakatoR[opt2]);
        break;
      case 32:
        poly.set(2, x2 - kMinWidthT, y2 + kage.kMinWidthY);
        poly.set(1, x2 + kMinWidthT, y2 + kage.kMinWidthY);
        break;
      }
      
      polygons.push(poly);
      
      if(a1 == 22){ //box's right top corner
        poly = new Polygon();
        poly.push(x1 - kMinWidthT, y1 - kage.kMinWidthY);
        poly.push(x1, y1 - kage.kMinWidthY - kage.kWidth);
        poly.push(x1 + kMinWidthT + kage.kWidth, y1 + kage.kMinWidthY);
        poly.push(x1 + kMinWidthT, y1 + kMinWidthT);
        poly.push(x1 - kMinWidthT, y1);
        polygons.push(poly);
      }
      
      if(a1 == 0){ //beginning of the stroke
        poly = new Polygon();
        poly.push(x1 + kMinWidthT, y1 + kage.kMinWidthY * 0.5);
        poly.push(x1 + kMinWidthT + kMinWidthT * 0.5, y1 + kage.kMinWidthY * 0.5 + kage.kMinWidthY);
        poly.push(x1 + kMinWidthT - 2, y1 + kage.kMinWidthY * 0.5 + kage.kMinWidthY * 2 + 1);
        polygons.push(poly);
      }
      
      if((a1 == 6 && a2 == 0) || a2 == 1){ //KAGI NO YOKO BOU NO SAIGO NO MARU ... no need only used at 1st=yoko
        poly = new Polygon();
	if(kage.kUseCurve){
          poly.push(x2 - kMinWidthT, y2);
          poly.push(x2 - kMinWidthT * 0.9, y2 + kMinWidthT * 0.9, 1);
          poly.push(x2, y2 + kMinWidthT);
          poly.push(x2 + kMinWidthT * 0.9, y2 + kMinWidthT * 0.9, 1);
          poly.push(x2 + kMinWidthT, y2);
        } else {
          poly.push(x2 - kMinWidthT, y2);
          poly.push(x2 - kMinWidthT * 0.6, y2 + kMinWidthT * 0.6);
          poly.push(x2, y2 + kMinWidthT);
          poly.push(x2 + kMinWidthT * 0.6, y2 + kMinWidthT * 0.6);
          poly.push(x2 + kMinWidthT, y2);
        }
        //poly.reverse(); // for fill-rule
        polygons.push(poly);
      }
    }
    else if(y1 == y2){ //if it is YOKO stroke, use x-axis
      if(a1 == 6){ //if it is KAGI's YOKO stroke, get bold
        poly = new Polygon();
        poly.push(x1, y1 - kMinWidthT);
        poly.push(x2, y2 - kMinWidthT);
        poly.push(x2, y2 + kMinWidthT);
        poly.push(x1, y1 + kMinWidthT);
        polygons.push(poly);
        
        if(a2 == 1 || a2 == 0 || a2 == 5){ // no need a2=1
          //KAGI NO YOKO BOU NO SAIGO NO MARU
          poly = new Polygon();
          if(kage.kUseCurve){
            if(x1 < x2){
              poly.push(x2, y2 - kMinWidthT);
              poly.push(x2 + kMinWidthT * 0.9, y2 - kMinWidthT * 0.9, 1);
              poly.push(x2 + kMinWidthT, y2);
              poly.push(x2 + kMinWidthT * 0.9, y2 + kMinWidthT * 0.9, 1);
              poly.push(x2, y2 + kMinWidthT);
            } else {
              poly.push(x2, y2 - kMinWidthT);
              poly.push(x2 - kMinWidthT * 0.9, y2 - kMinWidthT * 0.9, 1);
              poly.push(x2 - kMinWidthT, y2);
              poly.push(x2 - kMinWidthT * 0.9, y2 + kMinWidthT * 0.9, 1);
              poly.push(x2, y2 + kMinWidthT);
            }
          } else {
            if(x1 < x2){
              poly.push(x2, y2 - kMinWidthT);
              poly.push(x2 + kMinWidthT * 0.6, y2 - kMinWidthT * 0.6);
              poly.push(x2 + kMinWidthT, y2);
              poly.push(x2 + kMinWidthT * 0.6, y2 + kMinWidthT * 0.6);
              poly.push(x2, y2 + kMinWidthT);
            } else {
              poly.push(x2, y2 - kMinWidthT);
              poly.push(x2 - kMinWidthT * 0.6, y2 - kMinWidthT * 0.6);
              poly.push(x2 - kMinWidthT, y2);
              poly.push(x2 - kMinWidthT * 0.6, y2 + kMinWidthT * 0.6);
              poly.push(x2, y2 + kMinWidthT);
            }
          }
          polygons.push(poly);
        }
        
        if(a2 == 5){
          //KAGI NO YOKO BOU NO HANE
          poly = new Polygon();
          if(x1 < x2){
            poly.push(x2, y2 - kMinWidthT + 1);
            poly.push(x2 + 2, y2 - kMinWidthT - kage.kWidth * (4 * (1 - opt1 / kage.kAdjustMageStep) + 1));
            poly.push(x2, y2 - kMinWidthT - kage.kWidth * (4 * (1 - opt1 / kage.kAdjustMageStep) + 1));
            poly.push(x2 - kMinWidthT, y2 - kMinWidthT + 1);
          } else {
            poly.push(x2, y2 - kMinWidthT + 1);
            poly.push(x2 - 2, y2 - kMinWidthT - kage.kWidth * (4 * (1 - opt1 / kage.kAdjustMageStep) + 1));
            poly.push(x2, y2 - kMinWidthT - kage.kWidth * (4 * (1 - opt1 / kage.kAdjustMageStep) + 1));
            poly.push(x2 + kMinWidthT, y2 - kMinWidthT + 1);
          }
          //poly.reverse(); // for fill-rule
          polygons.push(poly);
        }
      }
      else{
        //always same
        poly = new Polygon(4);
        poly.set(0, x1, y1 - kage.kMinWidthY);
        poly.set(1, x2, y2 - kage.kMinWidthY);
        poly.set(2, x2, y2 + kage.kMinWidthY);
        poly.set(3, x1, y1 + kage.kMinWidthY);
        polygons.push(poly);
        
        //UROKO
        if(a2 == 0){
          poly = new Polygon();
          poly.push(x2, y2 - kage.kMinWidthY);
          poly.push(x2 - kage.kAdjustUrokoX[opt2], y2);
          poly.push(x2 - kage.kAdjustUrokoX[opt2] / 2, y2 - kage.kAdjustUrokoY[opt2]);
          polygons.push(poly);
        }
      }
    }
    else{ //for others, use x-axis
      rad = Math.atan((y2 - y1) / (x2 - x1));
      if((Math.abs(y2 - y1) < Math.abs(x2 - x1)) && (a1 != 6) && (a2 != 6) && !(x1 > x2)){ //ASAI KAUDO
        //always same
        poly = new Polygon(4);
        poly.set(0, x1 + Math.sin(rad) * kage.kMinWidthY, y1 - Math.cos(rad) * kage.kMinWidthY);
        poly.set(1, x2 + Math.sin(rad) * kage.kMinWidthY, y2 - Math.cos(rad) * kage.kMinWidthY);
        poly.set(2, x2 - Math.sin(rad) * kage.kMinWidthY, y2 + Math.cos(rad) * kage.kMinWidthY);
        poly.set(3, x1 - Math.sin(rad) * kage.kMinWidthY, y1 + Math.cos(rad) * kage.kMinWidthY);
        polygons.push(poly);
        
        //UROKO
        if(a2 == 0){
          poly = new Polygon();
          poly.push(x2 + Math.sin(rad) * kage.kMinWidthY, y2 - Math.cos(rad) * kage.kMinWidthY);
          poly.push(x2 - Math.cos(rad) * kage.kAdjustUrokoX[opt2], y2 - Math.sin(rad) * kage.kAdjustUrokoX[opt2]);
          poly.push(x2 - Math.cos(rad) * kage.kAdjustUrokoX[opt2] / 2 + Math.sin(rad) * kage.kAdjustUrokoX[opt2] / 2, y2 - Math.sin(rad) * kage.kAdjustUrokoY[opt2] - Math.cos(rad) * kage.kAdjustUrokoY[opt2]);
          polygons.push(poly);
        }
      }
      
      else{ //KAKUDO GA FUKAI or KAGI NO YOKO BOU
        if(x1 > x2){ v = -1; } else{ v = 1; }
        poly = new Polygon(4);
        switch(a1){
        case 0:
          poly.set(0, x1 + Math.sin(rad) * kMinWidthT * v + kage.kMinWidthY * Math.cos(rad) * 0.5 * v,
                   y1 - Math.cos(rad) * kMinWidthT * v + kage.kMinWidthY * Math.sin(rad) * 0.5 * v);
          poly.set(3, x1 - Math.sin(rad) * kMinWidthT * v - kage.kMinWidthY * Math.cos(rad) * 0.5 * v,
                   y1 + Math.cos(rad) * kMinWidthT * v - kage.kMinWidthY * Math.sin(rad) * 0.5 * v);
          break;
        case 1:
        case 6:
          poly.set(0, x1 + Math.sin(rad) * kMinWidthT * v, y1 - Math.cos(rad) * kMinWidthT * v);
          poly.set(3, x1 - Math.sin(rad) * kMinWidthT * v, y1 + Math.cos(rad) * kMinWidthT * v);
          break;
        case 12:
          poly.set(0, x1 + Math.sin(rad) * kMinWidthT * v - kage.kMinWidthY * Math.cos(rad) * v,
                   y1 - Math.cos(rad) * kMinWidthT * v - kage.kMinWidthY * Math.sin(rad) * v);
          poly.set(3, x1 - Math.sin(rad) * kMinWidthT * v - (kMinWidthT + kage.kMinWidthY) * Math.cos(rad) * v,
                   y1 + Math.cos(rad) * kMinWidthT * v - (kMinWidthT + kage.kMinWidthY) * Math.sin(rad) * v);
          break;
        case 22:
          poly.set(0, x1 + (kMinWidthT * v + 1) / Math.sin(rad), y1 + 1);
          poly.set(3, x1 - (kMinWidthT * v) / Math.sin(rad), y1);
          break;
        case 32:
          poly.set(0, x1 + (kMinWidthT * v) / Math.sin(rad), y1);
          poly.set(3, x1 - (kMinWidthT * v) / Math.sin(rad), y1);
          break;
        }
        
        switch(a2){
        case 0:
          if(a1 == 6){
            poly.set(1, x2 + Math.sin(rad) * kMinWidthT * v, y2 - Math.cos(rad) * kMinWidthT * v);
            poly.set(2, x2 - Math.sin(rad) * kMinWidthT * v, y2 + Math.cos(rad) * kMinWidthT * v);
          }
          else{
            poly.set(1, x2 + Math.sin(rad) * kMinWidthT * v - kMinWidthT * 0.5 * Math.cos(rad) * v,
                     y2 - Math.cos(rad) * kMinWidthT * v - kMinWidthT * 0.5 * Math.sin(rad) * v);
            poly.set(2, x2 - Math.sin(rad) * kMinWidthT * v + kMinWidthT * 0.5 * Math.cos(rad) * v,
                     y2 + Math.cos(rad) * kMinWidthT * v + kMinWidthT * 0.5 * Math.sin(rad) * v);
          }
          break;
        case 1: // is needed?
        case 5:
          poly.set(1, x2 + Math.sin(rad) * kMinWidthT * v, y2 - Math.cos(rad) * kMinWidthT * v);
          poly.set(2, x2 - Math.sin(rad) * kMinWidthT * v, y2 + Math.cos(rad) * kMinWidthT * v);
          break;
        case 13:
          poly.set(1, x2 + Math.sin(rad) * kMinWidthT * v + kage.kAdjustKakatoL[opt2] * Math.cos(rad) * v,
                   y2 - Math.cos(rad) * kMinWidthT * v + kage.kAdjustKakatoL[opt2] * Math.sin(rad) * v);
          poly.set(2, x2 - Math.sin(rad) * kMinWidthT * v + (kage.kAdjustKakatoL[opt2] + kMinWidthT) * Math.cos(rad) * v,
                   y2 + Math.cos(rad) * kMinWidthT * v + (kage.kAdjustKakatoL[opt2] + kMinWidthT) * Math.sin(rad) * v);
          break;
        case 23:
          poly.set(1, x2 + Math.sin(rad) * kMinWidthT * v + kage.kAdjustKakatoR[opt2] * Math.cos(rad) * v,
                   y2 - Math.cos(rad) * kMinWidthT * v + kage.kAdjustKakatoR[opt2] * Math.sin(rad) * v);
          poly.set(2,
                   x2 - Math.sin(rad) * kMinWidthT * v + (kage.kAdjustKakatoR[opt2] + kMinWidthT) * Math.cos(rad) * v,
                   y2 + Math.cos(rad) * kMinWidthT * v + (kage.kAdjustKakatoR[opt2] + kMinWidthT) * Math.sin(rad) * v);
          break;
        case 32:
          poly.set(1, x2 + (kMinWidthT * v) / Math.sin(rad), y2);
          poly.set(2, x2 - (kMinWidthT * v) / Math.sin(rad), y2);
          break;
        }
        
        polygons.push(poly);
        
        if((a1 == 6) && (a2 == 0 || a2 == 5)){ //KAGI NO YOKO BOU NO SAIGO NO MARU
          poly = new Polygon();
          if(kage.kUseCurve){
            poly.push(x2 + Math.sin(rad) * kMinWidthT * v, y2 - Math.cos(rad) * kMinWidthT * v);
            poly.push(x2 - Math.cos(rad) * kMinWidthT * 0.9 * v + Math.sin(rad) * kMinWidthT * 0.9 * v,
                      y2 + Math.sin(rad) * kMinWidthT * 0.9 * v - Math.cos(rad) * kMinWidthT * 0.9 * v, 1);
            poly.push(x2 + Math.cos(rad) * kMinWidthT * v, y2 + Math.sin(rad) * kMinWidthT * v);
            poly.push(x2 + Math.cos(rad) * kMinWidthT * 0.9 * v - Math.sin(rad) * kMinWidthT * 0.9 * v,
                      y2 + Math.sin(rad) * kMinWidthT * 0.9 * v + Math.cos(rad) * kMinWidthT * 0.9 * v, 1);
            poly.push(x2 - Math.sin(rad) * kMinWidthT * v, y2 + Math.cos(rad) * kMinWidthT * v);
          } else {
            poly.push(x2 + Math.sin(rad) * kMinWidthT * v, y2 - Math.cos(rad) * kMinWidthT * v);
            poly.push(x2 + Math.cos(rad) * kMinWidthT * 0.8 * v + Math.sin(rad) * kMinWidthT * 0.6 * v,
                      y2 + Math.sin(rad) * kMinWidthT * 0.8 * v - Math.cos(rad) * kMinWidthT * 0.6 * v);
            poly.push(x2 + Math.cos(rad) * kMinWidthT * v, y2 + Math.sin(rad) * kMinWidthT * v);
            poly.push(x2 + Math.cos(rad) * kMinWidthT * 0.8 * v - Math.sin(rad) * kMinWidthT * 0.6 * v,
                      y2 + Math.sin(rad) * kMinWidthT * 0.8 * v + Math.cos(rad) * kMinWidthT * 0.6 * v);
            poly.push(x2 - Math.sin(rad) * kMinWidthT * v, y2 + Math.cos(rad) * kMinWidthT * v);
          }
          polygons.push(poly);
        }
        
        if(a1 == 6 && a2 == 5){
          //KAGI NO YOKO BOU NO HANE
          poly = new Polygon();
          if(x1 < x2){
            poly.push(x2 + (kMinWidthT - 1) * Math.sin(rad) * v, y2 - (kMinWidthT - 1) * Math.cos(rad) * v);
            poly.push(x2 + 2 * Math.cos(rad) * v + (kMinWidthT + kage.kWidth * 5) * Math.sin(rad) * v,
                      y2 + 2 * Math.sin(rad) * v - (kMinWidthT + kage.kWidth * 5) * Math.cos(rad) * v);
            poly.push(x2 + (kMinWidthT + kage.kWidth * 5) * Math.sin(rad) * v,
                      y2 - (kMinWidthT + kage.kWidth * 5) * Math.cos(rad) * v);
            poly.push(x2 + (kMinWidthT - 1) * Math.sin(rad) * v - kMinWidthT * Math.cos(rad) * v,
                      y2 - (kMinWidthT - 1) * Math.cos(rad) * v - kMinWidthT * Math.sin(rad) * v);
          } else {
            poly.push(x2 - (kMinWidthT - 1) * Math.sin(rad) * v, y2 + (kMinWidthT - 1) * Math.cos(rad) * v);
            poly.push(x2 + 2 * Math.cos(rad) * v - (kMinWidthT + kage.kWidth * 5) * Math.sin(rad) * v,
                      y2 + 2 * Math.sin(rad) * v + (kMinWidthT + kage.kWidth * 5) * Math.cos(rad) * v);
            poly.push(x2 - (kMinWidthT + kage.kWidth * 5) * Math.sin(rad) * v,
                      y2 + (kMinWidthT + kage.kWidth * 5) * Math.cos(rad) * v);
            poly.push(x2 + (kMinWidthT - 1) * Math.sin(rad) * v - kMinWidthT * Math.cos(rad) * v,
                      y2 - (kMinWidthT - 1) * Math.cos(rad) * v - kMinWidthT * Math.sin(rad) * v);
          }
          polygons.push(poly);
        }
        
        if(a1 == 22){ //SHIKAKU MIGIUE UROKO NANAME DEMO MASSUGU MUKI
          poly = new Polygon();
          poly.push(x1 - kMinWidthT, y1 - kage.kMinWidthY);
          poly.push(x1, y1 - kage.kMinWidthY - kage.kWidth);
          poly.push(x1 + kMinWidthT + kage.kWidth, y1 + kage.kMinWidthY);
          poly.push(x1 + kMinWidthT, y1 + kMinWidthT - 1);
          poly.push(x1 - kMinWidthT, y1 + kMinWidthT + 4);
          polygons.push(poly);
        }
        
        XX = Math.sin(rad) * v;
        XY = Math.cos(rad) * v * -1;
        YX = Math.cos(rad) * v;
        YY = Math.sin(rad) * v;
        
        if(a1 == 0){ //beginning of the storke
          poly = new Polygon();
          poly.push(x1 + kMinWidthT * XX + (kage.kMinWidthY * 0.5) * YX,
                    y1 + kMinWidthT * XY + (kage.kMinWidthY * 0.5) * YY);
          poly.push(x1 + (kMinWidthT + kMinWidthT * 0.5) * XX + (kage.kMinWidthY * 0.5 + kage.kMinWidthY) * YX,
                    y1 + (kMinWidthT + kMinWidthT * 0.5) * XY + (kage.kMinWidthY * 0.5 + kage.kMinWidthY) * YY);
          poly.push(x1 + kMinWidthT * XX + (kage.kMinWidthY * 0.5 + kage.kMinWidthY * 2) * YX - 2 * XX,
                    y1 + kMinWidthT * XY + (kage.kMinWidthY * 0.5 + kage.kMinWidthY * 2) * YY + 1 * XY);
          polygons.push(poly);
        }
      }
    }
  }
  else{ //gothic
    if(tx1 == tx2){ //if TATE stroke, use y-axis
      if(ty1 > ty2){
        x1 = tx2;
        y1 = ty2;
        x2 = tx1;
        y2 = ty1;
        a1 = ta2;
        a2 = ta1;
      }
      else{
        x1 = tx1;
        y1 = ty1;
        x2 = tx2;
        y2 = ty2;
        a1 = ta1;
        a2 = ta2;
      }
      
      if(a1 % 10 == 2){ y1 = y1 - kage.kWidth; }
      if(a2 % 10 == 2){ y2 = y2 + kage.kWidth; }
      if(a1 % 10 == 3){ y1 = y1 - kage.kWidth * kage.kKakato; }
      if(a2 % 10 == 3){ y2 = y2 + kage.kWidth * kage.kKakato; }
      
      poly = new Polygon();
      poly.push(x1 - kage.kWidth, y1);
      poly.push(x2 - kage.kWidth, y2);
      poly.push(x2 + kage.kWidth, y2);
      poly.push(x1 + kage.kWidth, y1);
      //poly.reverse(); // for fill-rule
      
      polygons.push(poly);
    }
    else if(ty1 == ty2){ //if YOKO stroke, use x-axis
      if(tx1 > tx2){
        x1 = tx2;
        y1 = ty2;
        x2 = tx1;
        y2 = ty1;
        a1 = ta2;
        a2 = ta1;
      }
      else{
        x1 = tx1;
        y1 = ty1;
        x2 = tx2;
        y2 = ty2;
        a1 = ta1;
        a2 = ta2;
      }
      if(a1 % 10 == 2){ x1 = x1 - kage.kWidth; }
      if(a2 % 10 == 2){ x2 = x2 + kage.kWidth; }
      if(a1 % 10 == 3){ x1 = x1 - kage.kWidth * kage.kKakato; }
      if(a2 % 10 == 3){ x2 = x2 + kage.kWidth * kage.kKakato; }
      
      poly = new Polygon();
      poly.push(x1, y1 - kage.kWidth);
      poly.push(x2, y2 - kage.kWidth);
      poly.push(x2, y2 + kage.kWidth);
      poly.push(x1, y1 + kage.kWidth);
      
      polygons.push(poly);
    }
    else{ //for others, use x-axis
      if(tx1 > tx2){
        x1 = tx2;
        y1 = ty2;
        x2 = tx1;
        y2 = ty1;
        a1 = ta2;
        a2 = ta1;
      }
      else{
        x1 = tx1;
        y1 = ty1;
        x2 = tx2;
        y2 = ty2;
        a1 = ta1;
        a2 = ta2;
      }
      rad = Math.atan((y2 - y1) / (x2 - x1));
      if(a1 % 10 == 2){
        x1 = x1 - kage.kWidth * Math.cos(rad);
        y1 = y1 - kage.kWidth * Math.sin(rad);
      }
      if(a2 % 10 == 2){
        x2 = x2 + kage.kWidth * Math.cos(rad);
        y2 = y2 + kage.kWidth * Math.sin(rad);
      }
      if(a1 % 10 == 3){
        x1 = x1 - kage.kWidth * Math.cos(rad) * kage.kKakato;
        y1 = y1 - kage.kWidth * Math.sin(rad) * kage.kKakato;
      }
      if(a2 % 10 == 3){
        x2 = x2 + kage.kWidth * Math.cos(rad) * kage.kKakato;
        y2 = y2 + kage.kWidth * Math.sin(rad) * kage.kKakato;
      }
      
      //SUICHOKU NO ICHI ZURASHI HA Math.sin TO Math.cos NO IREKAE + x-axis MAINASU KA
      poly = new Polygon();
      poly.push(x1 + Math.sin(rad) * kage.kWidth, y1 - Math.cos(rad) * kage.kWidth);
      poly.push(x2 + Math.sin(rad) * kage.kWidth, y2 - Math.cos(rad) * kage.kWidth);
      poly.push(x2 - Math.sin(rad) * kage.kWidth, y2 + Math.cos(rad) * kage.kWidth);
      poly.push(x1 - Math.sin(rad) * kage.kWidth, y1 + Math.cos(rad) * kage.kWidth);
      
      polygons.push(poly);
    }
  }
}function dfDrawFont(kage, polygons, a1, a2, a3, x1, y1, x2, y2, x3, y3, x4, y4){
  var tx1, tx2, tx3, tx4, ty1, ty2, ty3, ty4, v;
  var rad;
	
  if(kage.kShotai == kage.kMincho){
    switch(a1 % 100){ // ... no need to divide
    case 0:
      break;
    case 1:
      if(a3 % 100 == 4){
        if(x1 == x2){
          if(y1 < y2){ v = 1; } else{ v = -1; }
          tx1 = x2;
          ty1 = y2 - kage.kMage * v;
        }
        else if(y1 == y2){ // ... no need
          if(x1 < x2){ v = 1; } else{ v = -1; }
          tx1 = x2 - kage.kMage * v;
          ty1 = y2;
        }
        else{
          rad = Math.atan((y2 - y1) / (x2 - x1));
          if(x1 < x2){ v = 1; } else{v = -1; }
          tx1 = x2 - kage.kMage * Math.cos(rad) * v;
          ty1 = y2 - kage.kMage * Math.sin(rad) * v;
        }
        cdDrawLine(kage, polygons, x1, y1, tx1, ty1, a2, 1);
        cdDrawCurve(kage, polygons, tx1, ty1, x2, y2, x2 - kage.kMage * (((kage.kAdjustTateStep + 4) - Math.floor(a2 / 1000)) / (kage.kAdjustTateStep + 4)), y2, 1 + (a2 - a2 % 1000), a3 + 10);
      }
      else{
        cdDrawLine(kage, polygons, x1, y1, x2, y2, a2, a3);
      }
      break;
    case 2:
    //case 12: // ... no need
      if(a3 % 100 == 4){
        if(x2 == x3){
          tx1 = x3;
          ty1 = y3 - kage.kMage;
        }
        else if(y2 == y3){
          tx1 = x3 - kage.kMage;
          ty1 = y3;
        }
        else{
          rad = Math.atan((y3 - y2) / (x3 - x2));
          if(x2 < x3){ v = 1; } else{ v = -1; }
          tx1 = x3 - kage.kMage * Math.cos(rad) * v;
          ty1 = y3 - kage.kMage * Math.sin(rad) * v;
        }
        cdDrawCurve(kage, polygons, x1, y1, x2, y2, tx1, ty1, a2, 1);
        cdDrawCurve(kage, polygons, tx1, ty1, x3, y3, x3 - kage.kMage, y3, 1, a3 + 10);
      }
      else if(a3 == 5){
        cdDrawCurve(kage, polygons, x1, y1, x2, y2, x3, y3, a2, 15);
      }
      else{
        cdDrawCurve(kage, polygons, x1, y1, x2, y2, x3, y3, a2, a3);
      }
      break;
    case 3:
      if(a3 % 1000 == 5){
        if(x1 == x2){
          if(y1 < y2){ v = 1; } else{ v = -1; }
          tx1 = x2;
          ty1 = y2 - kage.kMage * v;
        }
        else if(y1 == y2){
          if(x1 < x2){ v = 1; } else{ v = -1; }
          tx1 = x2 - kage.kMage * v;
          ty1 = y2;
        }
        else{
          rad = Math.atan((y2 - y1) / (x2 - x1));
          if(x1 < x2){ v = 1; } else{ v = -1; }
          tx1 = x2 - kage.kMage * Math.cos(rad) * v;
          ty1 = y2 - kage.kMage * Math.sin(rad) * v;
        }
        if(x2 == x3){
          if(y2 < y3){ v = 1; } else{ v = -1; }
          tx2 = x2;
          ty2 = y2 + kage.kMage * v;
        }
        else if(y2 == y3){
          if(x2 < x3){ v = 1; } else { v = -1; }
          tx2 = x2 + kage.kMage * v;
          ty2 = y2;
        }
        else{
          rad = Math.atan((y3 - y2) / (x3 - x2));
          if(x2 < x3){ v = 1; } else{ v = -1; }
          tx2 = x2 + kage.kMage * Math.cos(rad) * v;
          ty2 = y2 + kage.kMage * Math.sin(rad) * v;
        }
        tx3 = x3;
        ty3 = y3;
        
        cdDrawLine(kage, polygons, x1, y1, tx1, ty1, a2, 1);
        cdDrawCurve(kage, polygons, tx1, ty1, x2, y2, tx2, ty2, 1 + (a2 - a2 % 1000) * 10, 1 + (a3 - a3 % 1000));
        if((x2 < x3 && tx3 - tx2 > 0) || (x2 > x3 && tx2 - tx3 > 0)){ // for closer position
          cdDrawLine(kage, polygons, tx2, ty2, tx3, ty3, 6 + (a3 - a3 % 1000), 5); // bolder by force
        }
      }
      else{
        if(x1 == x2){
          if(y1 < y2){ v = 1; } else { v = -1; }
          tx1 = x2;
          ty1 = y2 - kage.kMage * v;
        }
        else if(y1 == y2){
          if(x1 < x2){ v = 1; } else{ v = -1; }
          tx1 = x2 - kage.kMage * v;
          ty1 = y2;
        }
        else{
          rad = Math.atan((y2 - y1) / (x2 - x1));
          if(x1 < x2){ v = 1; } else{ v = -1; }
          tx1 = x2 - kage.kMage * Math.cos(rad) * v;
          ty1 = y2 - kage.kMage * Math.sin(rad) * v;
        }
        if(x2 == x3){
          if(y2 < y3){ v = 1; } else{ v = -1; }
          tx2 = x2;
          ty2 = y2 + kage.kMage * v;
        }
        else if(y2 == y3){
          if(x2 < x3){ v = 1; } else{ v = -1; }
          tx2 = x2 + kage.kMage * v;
          ty2 = y2;
        }
        else{
          rad = Math.atan((y3 - y2) / (x3 - x2));
          if(x2 < x3){ v = 1; } else{ v = -1; }
          tx2 = x2 + kage.kMage * Math.cos(rad) * v;
          ty2 = y2 + kage.kMage * Math.sin(rad) * v;
        }
        cdDrawLine(kage, polygons, x1, y1, tx1, ty1, a2, 1);
        cdDrawCurve(kage, polygons, tx1, ty1, x2, y2, tx2, ty2, 1 + (a2 - a2 % 1000) * 10, 1 + (a3 - a3 % 1000));
        cdDrawLine(kage, polygons, tx2, ty2, x3, y3, 6 + (a3 - a3 % 1000), a3); // bolder by force
      }
      break;
    case 12:
      cdDrawCurve(kage, polygons, x1, y1, x2, y2, x3, y3, a2, 1);
      cdDrawLine(kage, polygons, x3, y3, x4, y4, 6, a3);
      break;
    case 4:
      rate = 6;
      if((x3 - x2) * (x3 - x2) + (y3 - y2) * (y3 - y2) < 14400){ // smaller than 120 x 120
        rate = Math.sqrt((x3 - x2) * (x3 - x2) + (y3 - y2) * (y3 - y2)) / 120 * 6;
      }
      if(a3 == 5){
        if(x1 == x2){
          if(y1 < y2){ v = 1; } else{ v = -1; }
          tx1 = x2;
          ty1 = y2 - kage.kMage * v * rate;
        }
        else if(y1 == y2){
          if(x1 < x2){ v = 1; } else{ v = -1; }
          tx1 = x2 - kage.kMage * v * rate;
          ty1 = y2;
        }
        else{
          rad = Math.atan((y2 - y1) / (x2 - x1));
          if(x1 < x2){ v = 1; } else{ v = -1; }
          tx1 = x2 - kage.kMage * Math.cos(rad) * v * rate;
          ty1 = y2 - kage.kMage * Math.sin(rad) * v * rate;
        }
        if(x2 == x3){
          if(y2 < y3){ v = 1; } else{ v = -1; }
          tx2 = x2;
          ty2 = y2 + kage.kMage * v * rate;
        }
        else if(y2 == y3){
          if(x2 < x3){ v = 1; } else { v = -1; }
          tx2 = x2 + kage.kMage * v * rate;
          ty2 = y2;
        }
        else{
          rad = Math.atan((y3 - y2) / (x3 - x2));
          if(x2 < x3){ v = 1; } else{ v = -1; }
          tx2 = x2 + kage.kMage * Math.cos(rad) * v * rate;
          ty2 = y2 + kage.kMage * Math.sin(rad) * v * rate;
        }
        tx3 = x3;
        ty3 = y3;
        
        cdDrawLine(kage, polygons, x1, y1, tx1, ty1, a2, 1);
        cdDrawCurve(kage, polygons, tx1, ty1, x2, y2, tx2, ty2, 1, 1);
        if(tx3 - tx2 > 0){ // for closer position
          cdDrawLine(kage, polygons, tx2, ty2, tx3, ty3, 6, 5); // bolder by force
        }
      }
      else{
        if(x1 == x2){
          if(y1 < y2){ v = 1; } else { v = -1; }
          tx1 = x2;
          ty1 = y2 - kage.kMage * v * rate;
        }
        else if(y1 == y2){
          if(x1 < x2){ v = 1; } else{ v = -1; }
          tx1 = x2 - kage.kMage * v * rate;
          ty1 = y2;
        }
        else{
          rad = Math.atan((y2 - y1) / (x2 - x1));
          if(x1 < x2){ v = 1; } else{ v = -1; }
          tx1 = x2 - kage.kMage * Math.cos(rad) * v * rate;
          ty1 = y2 - kage.kMage * Math.sin(rad) * v * rate;
        }
        if(x2 == x3){
          if(y2 < y3){ v = 1; } else{ v = -1; }
          tx2 = x2;
          ty2 = y2 + kage.kMage * v * rate;
        }
        else if(y2 == y3){
          if(x2 < x3){ v = 1; } else{ v = -1; }
          tx2 = x2 + kage.kMage * v * rate;
          ty2 = y2;
        }
        else{
          rad = Math.atan((y3 - y2) / (x3 - x2));
          if(x2 < x3){ v = 1; } else{ v = -1; }
          tx2 = x2 + kage.kMage * Math.cos(rad) * v * rate;
          ty2 = y2 + kage.kMage * Math.sin(rad) * v * rate;
        }
        cdDrawLine(kage, polygons, x1, y1, tx1, ty1, a2, 1);
        cdDrawCurve(kage, polygons, tx1, ty1, x2, y2, tx2, ty2, 1, 1);
        cdDrawLine(kage, polygons, tx2, ty2, x3, y3, 6, a3); // bolder by force
      }
      break;
    case 6:
      if(a3 % 100 == 4){
        if(x3 == x4){
          tx1 = x4;
          ty1 = y4 - kage.kMage;
        }
        else if(y3 == y4){
          tx1 = x4 - kage.kMage;
          ty1 = y4;
        }
        else{
          rad = Math.atan((y4 - y3) / (x4 - x3));
          if(x3 < x4){ v = 1; } else{ v = -1; }
          tx1 = x4 - kage.kMage * Math.cos(rad) * v;
          ty1 = y4 - kage.kMage * Math.sin(rad) * v;
        }
        cdDrawBezier(kage, polygons, x1, y1, x2, y2, x3, y3, tx1, ty1, a2, 1);
        cdDrawCurve(kage, polygons, tx1, ty1, x4, y4, x4 - kage.kMage, y4, 1, a3 + 10);
      }
      else if(a3 == 5){
        cdDrawBezier(kage, polygons, x1, y1, x2, y2, x3, y3, x4, y4, a2, 15);
      }
      else{
        cdDrawBezier(kage, polygons, x1, y1, x2, y2, x3, y3, x4, y4, a2, a3);
      }
      break;
    case 7:
      cdDrawLine(kage, polygons, x1, y1, x2, y2, a2, 1);
      cdDrawCurve(kage, polygons, x2, y2, x3, y3, x4, y4, 1 + (a2 - a2 % 1000), a3);
      break;
    case 9: // may not be exist ... no need
      //kageCanvas[y1][x1] = 0;
      //kageCanvas[y2][x2] = 0;
      break;
    default:
      break;
    }
  }
    
  else{ // gothic
    switch(a1 % 100){
    case 0:
      break;
    case 1:
      if(a3 == 4){
        if(x1 == x2){
          if(y1 < y2){ v = 1; } else{ v = -1; }
          tx1 = x2;
          ty1 = y2 - kage.kMage * v;
        }
        else if(y1 == y2){
          if(x1 < x2){ v = 1; } else{ v = -1; }
          tx1 = x2 - kage.kMage * v;
          ty1 = y2;
        }
        else{
          rad = Math.atan((y2 - y1) / (x2 - x1));
          if(x1 < x2){ v = 1; } else{ v = -1; }
          tx1 = x2 - kage.kMage * Math.cos(rad) * v;
          ty1 = y2 - kage.kMage * Math.sin(rad) * v;
        }
        cdDrawLine(kage, polygons, x1, y1, tx1, ty1, a2, 1);
        cdDrawCurve(kage, polygons, tx1, ty1, x2, y2, x2 - kage.kMage * 2, y2 - kage.kMage * 0.5, 1, 0);
      }
      else{
        cdDrawLine(kage, polygons, x1, y1, x2, y2, a2, a3);
      }
      break;
    case 2:
    case 12:
      if(a3 == 4){
        if(x2 == x3){
          tx1 = x3;
          ty1 = y3 - kage.kMage;
        }
        else if(y2 == y3){
          tx1 = x3 - kage.kMage;
          ty1 = y3;
        }
        else{
          rad = Math.atan((y3 - y2) / (x3 - x2));
          if(x2 < x3){ v = 1; } else{ v = -1; }
          tx1 = x3 - kage.kMage * Math.cos(rad) * v;
          ty1 = y3 - kage.kMage * Math.sin(rad) * v;
        }
        cdDrawCurve(kage, polygons, x1, y1, x2, y2, tx1, ty1, a2, 1);
        cdDrawCurve(kage, polygons, tx1, ty1, x3, y3, x3 - kage.kMage * 2, y3 - kage.kMage * 0.5, 1, 0);
      }
      else if(a3 == 5){
        tx1 = x3 + kage.kMage;
        ty1 = y3;
        tx2 = tx1 + kage.kMage * 0.5;
        ty2 = y3 - kage.kMage * 2;
        cdDrawCurve(kage, polygons, x1, y1, x2, y2, x3, y3, a2, 1);
        cdDrawCurve(kage, polygons, x3, y3, tx1, ty1, tx2, ty2, 1, 0);
      }
      else{
        cdDrawCurve(kage, polygons, x1, y1, x2, y2, x3, y3, a2, a3);
      }
      break;
    case 3:
      if(a3 == 5){
        if(x1 == x2){
          if(y1 < y2){ v = 1; } else{ v = -1; }
          tx1 = x2;
          ty1 = y2 - kage.kMage * v;
        }
        else if(y1 == y2){
          if(x1 < x2){ v = 1; } else{ v = -1; }
          tx1 = x2 - kage.kMage * v;
          ty1 = y2;
        }
        else{
          rad = Math.atan((y2 - y1) / (x2 - x1));
          if(x1 < x2){ v = 1; } else{ v = -1; }
          tx1 = x2 - kage.kMage * Math.cos(rad) * v;
          ty1 = y2 - kage.kMage * Math.sin(rad) * v;
        }
        if(x2 == x3){
          if(y2 < y3){ v = 1; } else{ v = -1; }
          tx2 = x2;
          ty2 = y2 + kage.kMage * v;
        }
        else if(y2 == y3){
          if(x2 < x3){ v = 1; } else{ v = -1; }
          tx2 = x2 + kage.kMage * v;
          ty2 = y2;
        }
        else{
          rad = Math.atan((y3 - y2) / (x3 - x2));
          if(x2 < x3){ v = 1; } else{ v = -1; }
          tx2 = x2 + kage.kMage * Math.cos(rad) * v;
          ty2 = y2 + kage.kMage * Math.sin(rad) * v;
        }
        tx3 = x3 - kage.kMage;
        ty3 = y3;
        tx4 = x3 + kage.kMage * 0.5;
        ty4 = y3 - kage.kMage * 2;
        
        cdDrawLine(kage, polygons, x1, y1, tx1, ty1, a2, 1);
        cdDrawCurve(kage, polygons, tx1, ty1, x2, y2, tx2, ty2, 1, 1);
        cdDrawLine(kage, polygons, tx2, ty2, tx3, ty3, 1, 1);
        cdDrawCurve(kage, polygons, tx3, ty3, x3, y3, tx4, ty4, 1, 0);
      }
      else{
        if(x1 == x2){
          if(y1 < y2){ v = 1; } else{ v = -1; }
          tx1 = x2;
          ty1 = y2 - kage.kMage * v;
        }
        else if(y1 == y2){
          if(x1 < x2){ v = 1; } else{ v = -1; }
          tx1 = x2 - kage.kMage * v;
          ty1 = y2;
        }
        else{
          rad = Math.atan((y2 - y1) / (x2 - x1));
          if(x1 < x2){ v = 1; } else{ v = -1; }
          tx1 = x2 - kage.kMage * Math.cos(rad) * v;
          ty1 = y2 - kage.kMage * Math.sin(rad) * v;
        }
        if(x2 == x3){
          if(y2 < y3){ v = 1; } else{ v = -1; }
          tx2 = x2;
          ty2 = y2 + kage.kMage * v;
        }
        else if(y2 == y3){
          if(x2 < x3){ v = 1; } else{ v = -1; }
          tx2 = x2 + kage.kMage * v;
          ty2 = y2;
        }
        else{
          rad = Math.atan((y3 - y2) / (x3 - x2));
          if(x2 < x3){ v = 1; } else{ v = -1; }
          tx2 = x2 + kage.kMage * Math.cos(rad) * v;
          ty2 = y2 + kage.kMage * Math.sin(rad) * v;
        }
        
        cdDrawLine(kage, polygons, x1, y1, tx1, ty1, a2, 1);
        cdDrawCurve(kage, polygons, tx1, ty1, x2, y2, tx2, ty2, 1, 1);
        cdDrawLine(kage, polygons, tx2, ty2, x3, y3, 1, a3);
      }
      break;
    case 6:
      if(a3 == 5){
        tx1 = x4 - kage.kMage;
        ty1 = y4;
        tx2 = x4 + kage.kMage * 0.5;
        ty2 = y4 - kage.kMage * 2;
        /*
				cdDrawCurve(x1, y1, x2, y2, (x2 + x3) / 2, (y2 + y3) / 2, a2, 1);
				cdDrawCurve((x2 + x3) / 2, (y2 + y3) / 2, x3, y3, tx1, ty1, 1, 1);
         */
        cdDrawBezier(kage, polygons, x1, y1, x2, y2, x3, y3, tx1, ty1, a2, 1);
        cdDrawCurve(kage, polygons, tx1, ty1, x4, y4, tx2, ty2, 1, 0);
      }
      else{
        /*
				cdDrawCurve(x1, y1, x2, y2, (x2 + x3) / 2, (y2 + y3) / 2, a2, 1);
				cdDrawCurve((x2 + x3) / 2, (y2 + y3) / 2, x3, y3, x4, y4, 1, a3);
         */
        cdDrawBezier(kage, polygons, x1, y1, x2, y2, x3, y3, x4, y4, a2, a3);
      }
      break;
    case 7:
      cdDrawLine(kage, polygons, x1, y1, x2, y2, a2, 1);
      cdDrawCurve(kage, polygons, x2, y2, x3, y3, x4, y4, 1, a3);
      break;
    case 9: // may not be exist
      //kageCanvas[y1][x1] = 0;
      //kageCanvas[y2][x2] = 0;
      break;
    default:
      break;
    }
  }
}function Polygon(number){
  // resolution : 0.1
  
  // method
  function push(x, y, off){ // void
    var temp = new Object();
    temp.x = Math.floor(x*10)/10;
    temp.y = Math.floor(y*10)/10;
    if(off != 1){
      off = 0;
    }
    temp.off = off;
    this.array.push(temp);
  }
  Polygon.prototype.push = push;
  
  function set(index, x, y, off){ // void
    this.array[index].x = Math.floor(x*10)/10;
    this.array[index].y = Math.floor(y*10)/10;
    if(off != 1){
      off = 0;
    }
    this.array[index].off = off;
  }
  Polygon.prototype.set = set;
  
  function reverse(){ // void
    this.array.reverse();
  }
  Polygon.prototype.reverse = reverse;
  
  function concat(poly){ // void
    this.array = this.array.concat(poly.array);
  }
  Polygon.prototype.concat = concat;
	
  function shift(){ // void
    this.array.shift();
  }
  Polygon.prototype.shift = shift;
	
  function unshift(x, y, off){ // void
    var temp = new Object();
    temp.x = Math.floor(x*10)/10;
    temp.y = Math.floor(y*10)/10;
    if(off != 1){
      off = 0;
    }
    temp.off = off;
    this.array.unshift(temp);
  }
  Polygon.prototype.unshift = unshift;
	
  // property
  this.array = new Array();
  
  // initialize
  if(number){
    for(var i = 0; i < number; i++){
      this.push(0, 0, 0);
    }
  }
  
  return this;
}function Polygons(){
  // method
 	function clear(){ // void
    this.array = new Array();
  }
  Polygons.prototype.clear = clear;
	
  function push(polygon){ // void
    // only a simple check
    var minx = 200;
    var maxx = 0;
    var miny = 200;
    var maxy = 0;
    var error = 0;
    for(var i = 0; i < polygon.array.length; i++){
      if(polygon.array[i].x < minx){
        minx = polygon.array[i].x;
      }
      if(polygon.array[i].x > maxx){
        maxx = polygon.array[i].x;
      }
      if(polygon.array[i].y < miny){
        miny = polygon.array[i].y;
      }
      if(polygon.array[i].y > maxy){
        maxy = polygon.array[i].y;
      }
      if(isNaN(polygon.array[i].x) || isNaN(polygon.array[i].y)){
        error++;
      }
    }
    if(error == 0 && minx != maxx && miny != maxy && polygon.array.length >= 3){
      var newArray = new Array();
      newArray.push(polygon.array.shift());
      while(polygon.array.length != 0){
        var temp = polygon.array.shift();
        //if(newArray[newArray.length - 1].x != temp.x ||
        //   newArray[newArray.length - 1].y != temp.y){
          newArray.push(temp);
        //}
      }
      if(newArray.length >= 3){
        polygon.array = newArray;
        this.array.push(polygon);
      }
    }
  }
  Polygons.prototype.push = push;
  
  function generateSVG(curve){ // string
    var buffer = "";
    buffer += "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" baseProfile=\"full\" viewBox=\"0 0 200 200\" width=\"200\" height=\"200\">\n";
    if(curve){
      for(var i = 0; i < this.array.length; i++){
        var mode = "L";
        buffer += "<path d=\"M ";
        buffer += this.array[i].array[0].x + "," + this.array[i].array[0].y + " ";
        for(var j = 1; j < this.array[i].array.length; j++){
          if(this.array[i].array[j].off == 1){
            buffer += "Q ";
            mode = "Q";
          } else if(mode == "Q" && this.array[i].array[j - 1].off != 1){
            buffer += "L ";
          } else if(mode == "L" && j == 1){
            buffer += "L ";
          }
          buffer += this.array[i].array[j].x + "," + this.array[i].array[j].y + " ";
        }
        buffer += "Z\" fill=\"black\" />\n";
      }
      buffer += "</svg>\n";
    } else {
      buffer += "<g fill=\"black\">\n";
      for(var i = 0; i < this.array.length; i++){
        buffer += "<polygon points=\"";
        for(var j = 0; j < this.array[i].array.length; j++){
          buffer += this.array[i].array[j].x + "," + this.array[i].array[j].y + " ";
        }
        buffer += "\" />\n";
      }
      buffer += "</g>\n";
      buffer += "</svg>\n";
    }
    return buffer;
  }
  Polygons.prototype.generateSVG = generateSVG;
  
  function generateEPS(){ // string
    var buffer = "";
    buffer += "%!PS-Adobe-3.0 EPSF-3.0\n";
    buffer += "%%BoundingBox: 0 -208 1024 816\n";
    buffer += "%%Pages: 0\n";
    buffer += "%%Title: Kanji glyph\n";
    buffer += "%%Creator: GlyphWiki powered by KAGE system\n";
    buffer += "%%CreationDate: " + new Date() + "\n";
    buffer += "%%EndComments\n";
    buffer += "%%EndProlog\n";
    
    for(var i = 0; i < this.array.length; i++){
      for(var j = 0; j < this.array[i].array.length; j++){
        buffer += (this.array[i].array[j].x * 5) + " " + (1000 - this.array[i].array[j].y * 5 - 200) + " ";
        if(j == 0){
          buffer += "newpath\nmoveto\n";
        } else {
          buffer += "lineto\n";
        }
      }
      buffer += "closepath\nfill\n";
    }
    buffer += "%%EOF\n";
    return buffer;
  }
  Polygons.prototype.generateEPS = generateEPS;
  
  // property
  this.array = new Array();
  
  return this;
}
module.exports={Kage:Kage,Polygons:Polygons}
},{}],"C:\\ksana2015\\kage-glyph-sample\\parts.js":[function(require,module,exports){
var uniutil		=require("./src/uniutil"	);
var ucs2string	=uniutil.ucs2string; // 回應 unicode 數值 的 中文字
var getutf32	=uniutil.getutf32; // 回應 中文字 的 unicode 數值
var pp=/99[:-\d]+([a-z][a-z0-9-]*)/;
var pg=/99[:-\d]+([a-z][a-z0-9-]*)/g;

var getParts=function(u){
  var i=GLYPH[u];
  var d=GLYPHS[i].replace(/~/g,'99:0:0:');
  if(!d) return;
  var out=u;
  var uu=d.match(pg); // 所有部件組字資訊
  if(!uu) return out;
  for(var i=0; i<uu.length; i++){
    var child=uu[i].match(pp)[1]; // 每個部件名
    if(out.indexOf(child)<0)
      out+=' '+getParts(child);
  }
  console.log(out.replace(/ /,' <-- '));
  return out;
}
var getUnicodeParts=function(unicode) {
	var code=getutf32({widestring:unicode});
	var res=getParts('u'+code.toString(16)).split(' ');
//	res.shift();
	var out=[];
	for (var i in res) {
		var unicode=res[i].substr(1);
		var at=unicode.indexOf("-");
		if (at>-1) unicode=unicode.substr(0,at);
		var str=ucs2string( parseInt(unicode,16));
		if (out.indexOf(str)==-1)	out.push(str);
	}
	out.shift();//drop first
	return out;
}
console.log("萌",getUnicodeParts("萌"));
module.exports={getParts:getParts,getUnicodeParts};
},{"./src/uniutil":"C:\\ksana2015\\kage-glyph-sample\\src\\uniutil.js"}],"C:\\ksana2015\\kage-glyph-sample\\src\\kageglyph.js":[function(require,module,exports){
var Kage=require("kage").Kage;
var Polygons=require("kage").Polygons;
var React=require("react");
var E=React.createElement;
//var mockdata=require("./mockdata");
//var glyphs=["u5361","u897f","u52a0","u6cb9"];
var kage = new Kage();
kage.kUseCurve = true;
var loadBuhins=function(fromserver){
	for (var buhin in fromserver) {
		kage.kBuhin.push(buhin,fromserver[buhin]);
	}
}
//loadBuhins(mockdata);

var KageGlyph=React.createClass({displayName: "KageGlyph",
	propTypes:{
		glyph:React.PropTypes.string.isRequired
		,size:React.PropTypes.number
	}
	,render:function(){
		var polygons = new Polygons();
		var glyph=this.props.glyph;
		//glyph="u2b101"
		kage.makeGlyph(polygons, glyph);
    var svg=polygons.generateSVG(true);

      //viewBox="0 0 200 200" width="200" height="200"
    var size=this.props.size||64;
    svg=svg.replace('viewBox="0 0 200 200" width="200" height="200"',
      'background-color="transparent" viewBox="0 0 200 200" width="'+size+'" height="'+size+'"');
		return E("span",{label:this.props.glyph, dangerouslySetInnerHTML:{__html:svg}});
	}
});
KageGlyph.loadBuhins=loadBuhins;
module.exports=KageGlyph;
},{"kage":"C:\\ksana2015\\kage-glyph-sample\\node_modules\\kage\\index.js","react":"react"}],"C:\\ksana2015\\kage-glyph-sample\\src\\main.jsx":[function(require,module,exports){
(function(){
  var o={};
  GLYPH=GLYPH.split(";");
  for (var i=0;i<GLYPH.length;i++) {
    o[GLYPH[i]]=i;
  }
  glyph=window.GLYPH=o;
})();


var React=require("react");
var Kage=require("kage").Kage;
var KageGlyph=require("./kageglyph");
var SingleGlyph=require("./singleglyph");
var dgg=require("../dgg");
      console.time('main load glyph data');
//var glyph=require("../glyph"); // i=glyph['u3400']=0, j=glyph['u20003-jv']=80459, ...
//var glyphs=require("../glyphs"); // data['u3400']=glyphs[0], data['u20003-jv']=glyphs[j], ...
var glyphs=GLYPHS;
var glyph=GLYPH;


      console.timeEnd('main load glyph data');
      var styles={
  candidates:{outline:0,cursor:"pointer"}
  ,input:{fontSize:"200%"}
  ,component:{fontSize:"150%"}
};
var E=React.createElement;
var uniutil=require("./uniutil");
var getutf32=uniutil.getutf32;
var ucs2string=uniutil.ucs2string;
// var fontserverurl="http://chikage.linode.caasih.net/exploded/?inputs=";

var maincomponent = React.createClass({displayName: "maincomponent",
  getInitialState:function() {
    window.main=this; // just for debugging
    // var toload="婆女卡棚朋國組且系財才手閉才火邏羅人";
    // 1. 萌日目 遞迴搜尋 找到 萌 中 明 的 部件 日 換成 目
    // var toload="萌日目";
    // 2. 𩀨從䞃致招 遞迴運作 將 部件 從 換成 䞃 繼續 再將 部件 致 換成 招
    // var toload="𩀨從䞃致招";
    // 3. b push e pop
    var toload=""; // 邏羅寶貝𩀨從䞃致招";
    return {searchresult:[],toload:toload}
  }, stack:[]
  ,reform2:function(buhins){
    var data={}, newfonts=[];
    for (var k in buhins) {
      data[k]=buhins[k].replace(/@\d+/g, ""); //workaround @n at the end
      data[k].key=k;
    }
    var unicodes=this.state.unicodes;
    if(unicodes){
      var c=unicodes.shift(), d, a;
      while(unicodes.length){
        d=unicodes.shift();
        a=unicodes.shift();
        if(a)
          c=dgg.partReplace(data,c,d,a);
      }
    }
    return data;
  }
  ,componentDidMount:function(){
    //this.loadFromServer();
      this.loadFromJSON();
  }
  ,ucs:function(c){if(c)return ucs2string(parseInt(c.substr(1),16));}
  ,load:function(buhins) {
    var data=this.reform2(buhins); // 增加新字
    KageGlyph.loadBuhins(data);
    this.setState({data:data});
    this.fontdataready=true;
    this.setState({kagegkyph:this.renderGlyphs(this.state.toload)});
    return;
  }
  ,renderGlyphs:function(toload) {
    if(!this.state.data)return;
    var keys=Object.keys(this.state.data);
    if(keys===[])return;
    var opts={widestring:toload};
    var unicodes=this.state.unicodes;
    var newfonts=this.state.data.newfonts;
    if(!newfonts)return[];
    var out=[], data=this.state.data, ucs=this.ucs;
    for(var i=0; i<newfonts.length; i++){
      var newfont=newfonts[i];
      var widechars=newfont.split(':');
      if(this.state.data[newfont]){
        out.push(E(KageGlyph,{glyph: newfont, size: 80})); // 組合產生的新字
      }
    }
    out.push(E('br'));
    out.push(E('br'));
    out.push('相關參考文字或部件');
    out.push(E('br'));
    Object.keys(this.state.data).forEach(function(key){
      if(key==='newfonts')return;
      var m=key.match(/^u[\da-f]+/);
      if(m){
        var c=m?m[0]:m, dc=data[c];
        if(c && !dc){
          data[c]=c;
          out.push(c+ucs(c)+' ');
        }
      }
      out.push(key);
      out.push(E(KageGlyph,{glyph: key, size: 40}));
    });
    return out;
  }
  ,loadFromJSON:function() {
    var toload=this.state.toload;
    var opts={widestring:toload};
    var unicodes=[],widechars=[],unicode,widechar,i=0;
    var data={}, u;
    while (unicode=getutf32(opts)){
      unicodes[i]=u='u'+unicode.toString(16);
      dgg.getAllGlyphs(data,u);
      data[u]=glyphs[glyph[u]].replace(/~/g,"99:0:0:");
      widechars[i]=widechar=ucs2string(unicode); i++;
    }
    this.load(data);
    this.setState({unicodes:unicodes,widechars:widechars});
  }
  ,loadFromServer:function() {
    var toload=this.state.toload;
    var url=fontserverurl+toload;
    var opts={widestring:toload};
    var unicodes=[],widechars=[],unicode,widechar,i=0;
    while (unicode=getutf32(opts)){
      unicodes[i]='u'+unicode.toString(16);
      widechars[i]=widechar=ucs2string(unicode); i++;
    }
    this.setState({unicodes:unicodes,widechars:widechars});
    fetch(url.replace(/[\(\)]/g,''))
      .then(function(response){
        var json=response.json();
        return json; })
      .then(this.load);
  }  
  ,onChange:function(e) {
    clearTimeout(this.timer1);
    var toload=e.target.value;
    if(this.state.data)
      this.state.data['new']=undefined;
    this.setState({toload:toload});
    this.timer1=setTimeout(function(){
    //this.loadFromServer();
      this.loadFromJSON();
    }.bind(this),0)
  }
  ,render: function() {
    if (window.location.search) {
      return E(SingleGlyph,{expression:window.location.search.substr(1)})
    }
    return E("div", null, "先取原字 c, 連續取 da 以生新字 c, 將原字 c 部件 d 換字 a"
            ,E("br")
            ,E("input"
              ,{ref:"toload"
              ,value:this.state.toload
              ,onChange:this.onChange
              ,style:styles.input,size:50})
            ,E("br")
            ,E("span"
              ,{ref:"candidates"
              ,onMouseUp:this.onselect
              ,onTouchTap:this.onselect
              ,style:styles.candidates}
            ,this.state.kagegkyph)
            );
  }
});
module.exports=maincomponent;
},{"../dgg":"C:\\ksana2015\\kage-glyph-sample\\dgg.js","./kageglyph":"C:\\ksana2015\\kage-glyph-sample\\src\\kageglyph.js","./singleglyph":"C:\\ksana2015\\kage-glyph-sample\\src\\singleglyph.js","./uniutil":"C:\\ksana2015\\kage-glyph-sample\\src\\uniutil.js","kage":"C:\\ksana2015\\kage-glyph-sample\\node_modules\\kage\\index.js","react":"react"}],"C:\\ksana2015\\kage-glyph-sample\\src\\singleglyph.js":[function(require,module,exports){
// singleGlyph.js
console.log('loading singleGlyph.js');
// http://127.0.0.1:2556/kage-glyph-sample/?q=邏羅寶貝𩀨從䞃致招&sz=512&chk
var React=require("react");
var Kage=require("kage").Kage;
var KageGlyph=require("./kageglyph");
var getutf32=require("./uniutil").getutf32; // 回中文字對應的 unicode 數值
var ucs2string=require("./uniutil").ucs2string; // 回 unicode 數值對應的中文字
var dgg=require("../dgg");
var getParts=require("../parts").getParts;
//var GR=require("../glyphreplace"); // ?????? 如何放到 ksana2015 的 node_modules 中 ??????
//var glyph=require("../glyph"); // i=glyph['u3400']=0, j=glyph['u20003-jv']=80459, ...
//var glyphs=require("../glyphs"); // data['u3400']=glyphs[0], data['u20003-jv']=glyphs[j], ...
//      console.timeEnd('singleglyph load glyph data');
var glyph=GLYPH;
var glyphs=GLYPHS;

var E=React.createElement;
var ucs=function(c){ // 回 unicode 字串對應的中文字
	if(c)return ucs2string(parseInt(c.substr(1),16)).replace(/\r/,'');}
var getParamVal=function(key,def){ // get url parameter value by key
    var search=window.location.search;
    var parms=search?decodeURIComponent(search.substr(1)):"";
    var m=parms.match(RegExp('\\b'+key+'=([^&]+)')); return m?m[1]:def;
}
var checkParam=function(key){ // get url parameter value by key
    var search=window.location.search;
    var parms=search?decodeURIComponent(search.substr(1)):"";
    var m=parms.match(RegExp('\\b'+key+'\\b')); return m;
}
var SingleGlyph=React.createClass({displayName: "SingleGlyph",
	getInitialState:function() {
	    var toload=getParamVal('q',"婆女卡"); // 棚朋國組且系財才手閉才火邏羅人
	    var size=parseInt(getParamVal('sz',256));
	    return {toload:toload,size:size}
	}
	,unicodes:[], data:{}
	,componentDidMount:function() {
	     this.loadFromJSON();
	}
	,loadFromJSON:function() {
		var toload=this.state.toload;
		var opts={widestring:toload};
		var unicodes=[],widechars=[],unicode,widechar,i=0;
		var data={}, u;
		while (unicode=getutf32(opts)){
		  widechar=ucs2string(unicode);
		  if(widechar>='1' && widechar<='9'){
		  	  var j=unicode-0x31; // part index in widechars[i-1]
		  	  var c=widechars[i-1], u='u'+getutf32({widestring:c}).toString(16);
		  	  var t=getParts(u), L=t.split(' '); L.shift();
		  	  console.log(c+u+' <-- '+L.map(function(u,i){
		  	  	return (i+1)+' '+ucs(u)+u;
		  	  }).join(' '));
		  	  u=L[j];
		  	  widechar=u.match(/^u[0-9a-f]{4,5}/)?ucs(u):u;
		  } else u='u'+unicode.toString(16);
		  unicodes[i]=u;
		  dgg.getAllGlyphs(data,u);
		  data[u]=glyphs[glyph[u]].replace(/~/g,"99:0:0:");
		  widechars[i]=widechar; i++;
		}
		this.unicodes=unicodes;
	//	this.widechars=widechars;
		this.data=this.reform(data);
		this.setState({unicodes:unicodes,widechars:widechars,fontdataready:true});
	}
	,loadFromServer:function() {
		var toload=this.state.toload;
		var url="http://chikage.linode.caasih.net/exploded/?inputs="+toload;
		var opts={widestring:toload};
		var unicode,i=0,that=this;
		while (unicode=getutf32(opts))
			this.unicodes[i++]='u'+unicode.toString(16);
		fetch(url.replace(/[\(\)]/g,''))
			.then(function(response){
				return response.json(); 
			})
			.then(function(buhins) {
				var data=that.data=that.reform(buhins); // 增加新字
				KageGlyph.loadBuhins(data);
				that.setState({fontdataready:true});
			});
	}
	,reform:function(buhins){
		var data={};
		for (var k in buhins) data[k]=buhins[k].replace(/@\d+/g, ""); //workaround @n at the end
	//	data['c']="99:0:0:-10:-10:140:140:d$99:0:0:60:60:240:240:b";
	//	data['b']="1:0:0:50:100:100:50$1:0:0:100:50:150:100$1:0:0:150:100:100:150$1:0:0:100:150:50:100";
	//	data['d']="1:0:0:50:50:150:50$1:0:0:150:50:150:150$1:0:0:150:150:50:150$1:0:0:50:150:50:50";
	//	data['a']="1:0:0:50:50:150:150$1:0:0:50:150:150:50";
		this.thefont=dgg.partsReplace(data,this.unicodes);
		KageGlyph.loadBuhins(data);
		return data;
	}
	,renderGlyphs:function(toload,that) {
		var size=this.state.size, out=[], data=this.data;
		var keys=Object.keys(data), ucs=dgg.ucs, thefont=this.thefont;
		var i=0;
		if(keys.length){
			if(thefont){
				out.push(E(KageGlyph,{glyph: thefont, key: i++, size: size})); // 組合產生的字
				out.push(E('br',{key:i++}));
			}
			if(checkParam('chk')) keys.forEach(function(key){
				var m=key.match(/^u[\da-f]+/), t='';
				if(m)
					t=ucs(key);
				out.push(E("span",{key:i++},t+key+' '));
				out.push(E(KageGlyph,{glyph: key, key:i++, size: 40}));
			})
		}
		if(!checkParam('chk'))
			return out;
		var c=thefont, u;
		if(c.match(/^u[0-9a-f]{4,5}?/))
			u=c, c=ucs(u);
		else
			u='u'+getutf32({widestring:c}).toString(16);
		out.push(E('br',{key:'b1'}));
		var pp=getParts(u);
		if(pp){
			var L=pp.split(' ');
			L.forEach(function(u,j){
				out.push(E("span",{key:i++,'font-size':10},j+ucs(u)+u));
				out.push(E(KageGlyph,{glyph: u, key:i++, size: 40}));
			})
		}
		return out;
	}
	,render:function() {
		var out='nothing yet';
		if(this.state.fontdataready)
			out=this.renderGlyphs(this.state.toload,this);
		return E("div", null, out);
	}
})
module.exports=SingleGlyph;
},{"../dgg":"C:\\ksana2015\\kage-glyph-sample\\dgg.js","../parts":"C:\\ksana2015\\kage-glyph-sample\\parts.js","./kageglyph":"C:\\ksana2015\\kage-glyph-sample\\src\\kageglyph.js","./uniutil":"C:\\ksana2015\\kage-glyph-sample\\src\\uniutil.js","kage":"C:\\ksana2015\\kage-glyph-sample\\node_modules\\kage\\index.js","react":"react"}],"C:\\ksana2015\\kage-glyph-sample\\src\\uniutil.js":[function(require,module,exports){

//內碼轉字
var ucs2string = function (unicode) { //unicode ���X�� �r���A�textension B ���p
    if (unicode >= 0x10000 && unicode <= 0x10FFFF) {
      var hi = Math.floor((unicode - 0x10000) / 0x400) + 0xD800;
      var lo = ((unicode - 0x10000) % 0x400) + 0xDC00;
      return String.fromCharCode(hi) + String.fromCharCode(lo);
    } else {
      return String.fromCharCode(unicode);
    }
};
//取得字元的utf32 值
var getutf32 = function (opt) { // return ucs32 value from a utf 16 string, advance the string automatically
  if (!opt.widestring) return 0;
  var s = opt.widestring;
  var ic = s.charCodeAt(0);
  var c = 1; // default BMP one widechar
  if (ic >= 0xd800 && ic <= 0xdcff) {
    var ic2 = s.charCodeAt(1);
    ic = 0x10000 + ((ic & 0x3ff) * 1024) + (ic2 & 0x3ff);
    c++; // surrogate pair
  }
  opt.thechar = s.substr(0, c);
  opt.widestring = s.substr(c, s.length - c);
  return ic;
};

module.exports={getutf32:getutf32,ucs2string:ucs2string};
},{}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\downloader.js":[function(require,module,exports){

var userCancel=false;
var files=[];
var totalDownloadByte=0;
var targetPath="";
var tempPath="";
var nfile=0;
var baseurl="";
var result="";
var downloading=false;
var startDownload=function(dbid,_baseurl,_files) { //return download id
	var fs     = require("fs");
	var path   = require("path");

	
	files=_files.split("\uffff");
	if (downloading) return false; //only one session
	userCancel=false;
	totalDownloadByte=0;
	nextFile();
	downloading=true;
	baseurl=_baseurl;
	if (baseurl[baseurl.length-1]!='/')baseurl+='/';
	targetPath=ksanagap.rootPath+dbid+'/';
	tempPath=ksanagap.rootPath+".tmp/";
	result="";
	return true;
}

var nextFile=function() {
	setTimeout(function(){
		if (nfile==files.length) {
			nfile++;
			endDownload();
		} else {
			downloadFile(nfile++);	
		}
	},100);
}

var downloadFile=function(nfile) {
	var url=baseurl+files[nfile];
	var tmpfilename=tempPath+files[nfile];
	var mkdirp = require("./mkdirp");
	var fs     = require("fs");
	var http   = require("http");

	mkdirp.sync(path.dirname(tmpfilename));
	var writeStream = fs.createWriteStream(tmpfilename);
	var datalength=0;
	var request = http.get(url, function(response) {
		response.on('data',function(chunk){
			writeStream.write(chunk);
			totalDownloadByte+=chunk.length;
			if (userCancel) {
				writeStream.end();
				setTimeout(function(){nextFile();},100);
			}
		});
		response.on("end",function() {
			writeStream.end();
			setTimeout(function(){nextFile();},100);
		});
	});
}

var cancelDownload=function() {
	userCancel=true;
	endDownload();
}
var verify=function() {
	return true;
}
var endDownload=function() {
	nfile=files.length+1;//stop
	result="cancelled";
	downloading=false;
	if (userCancel) return;
	var fs     = require("fs");
	var mkdirp = require("./mkdirp");

	for (var i=0;i<files.length;i++) {
		var targetfilename=targetPath+files[i];
		var tmpfilename   =tempPath+files[i];
		mkdirp.sync(path.dirname(targetfilename));
		fs.renameSync(tmpfilename,targetfilename);
	}
	if (verify()) {
		result="success";
	} else {
		result="error";
	}
}

var downloadedByte=function() {
	return totalDownloadByte;
}
var doneDownload=function() {
	if (nfile>files.length) return result;
	else return "";
}
var downloadingFile=function() {
	return nfile-1;
}

var downloader={startDownload:startDownload, downloadedByte:downloadedByte,
	downloadingFile:downloadingFile, cancelDownload:cancelDownload,doneDownload:doneDownload};
module.exports=downloader;
},{"./mkdirp":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\mkdirp.js","fs":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\lib\\_empty.js","http":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\http-browserify\\index.js","path":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\path-browserify\\index.js"}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\html5fs.js":[function(require,module,exports){
/* emulate filesystem on html5 browser */
var get_head=function(url,field,cb){
	var xhr = new XMLHttpRequest();
	xhr.open("HEAD", url, true);
	xhr.onreadystatechange = function() {
			if (this.readyState == this.DONE) {
				cb(xhr.getResponseHeader(field));
			} else {
				if (this.status!==200&&this.status!==206) {
					cb("");
				}
			}
	};
	xhr.send();
}
var get_date=function(url,cb) {
	get_head(url,"Last-Modified",function(value){
		cb(value);
	});
}
var get_size=function(url, cb) {
	get_head(url,"Content-Length",function(value){
		cb(parseInt(value));
	});
};
var checkUpdate=function(url,fn,cb) {
	if (!url) {
		cb(false);
		return;
	}
	get_date(url,function(d){
		API.fs.root.getFile(fn, {create: false, exclusive: false}, function(fileEntry) {
			fileEntry.getMetadata(function(metadata){
				var localDate=Date.parse(metadata.modificationTime);
				var urlDate=Date.parse(d);
				cb(urlDate>localDate);
			});
		},function(){
			cb(false);
		});
	});
}
var download=function(url,fn,cb,statuscb,context) {
	 var totalsize=0,batches=null,written=0;
	 var fileEntry=0, fileWriter=0;
	 var createBatches=function(size) {
		var bytes=1024*1024, out=[];
		var b=Math.floor(size / bytes);
		var last=size %bytes;
		for (var i=0;i<=b;i++) {
			out.push(i*bytes);
		}
		out.push(b*bytes+last);
		return out;
	 }
	 var finish=function() {
		 rm(fn,function(){
				fileEntry.moveTo(fileEntry.filesystem.root, fn,function(){
					setTimeout( cb.bind(context,false) , 0) ;
				},function(e){
					console.log("failed",e)
				});
		 },this);
	 };
		var tempfn="temp.kdb";
		var batch=function(b) {
		var abort=false;
		var xhr = new XMLHttpRequest();
		var requesturl=url+"?"+Math.random();
		xhr.open('get', requesturl, true);
		xhr.setRequestHeader('Range', 'bytes='+batches[b]+'-'+(batches[b+1]-1));
		xhr.responseType = 'blob';
		xhr.addEventListener('load', function() {
			var blob=this.response;
			fileEntry.createWriter(function(fileWriter) {
				fileWriter.seek(fileWriter.length);
				fileWriter.write(blob);
				written+=blob.size;
				fileWriter.onwriteend = function(e) {
					if (statuscb) {
						abort=statuscb.apply(context,[ fileWriter.length / totalsize,totalsize ]);
						if (abort) setTimeout( cb.bind(context,false) , 0) ;
				 	}
					b++;
					if (!abort) {
						if (b<batches.length-1) setTimeout(batch.bind(context,b),0);
						else                    finish();
				 	}
			 	};
			}, console.error);
		},false);
		xhr.send();
	}

	get_size(url,function(size){
		totalsize=size;
		if (!size) {
			if (cb) cb.apply(context,[false]);
		} else {//ready to download
			rm(tempfn,function(){
				 batches=createBatches(size);
				 if (statuscb) statuscb.apply(context,[ 0, totalsize ]);
				 API.fs.root.getFile(tempfn, {create: 1, exclusive: false}, function(_fileEntry) {
							fileEntry=_fileEntry;
						batch(0);
				 });
			},this);
		}
	});
}

var readFile=function(filename,cb,context) {
	API.fs.root.getFile(filename, {create: false, exclusive: false},function(fileEntry) {
		fileEntry.file(function(file){
			var reader = new FileReader();
			reader.onloadend = function(e) {
				if (cb) cb.call(cb,this.result);
			};
			reader.readAsText(file,"utf8");
		});
	}, console.error);
}

function createDir(rootDirEntry, folders,  cb) {
  // Throw out './' or '/' and move on to prevent something like '/foo/.//bar'.
  if (folders[0] == '.' || folders[0] == '') {
    folders = folders.slice(1);
  }
  rootDirEntry.getDirectory(folders[0], {create: true}, function(dirEntry) {
    // Recursively add the new subfolder (if we still have another to create).
    if (folders.length) {
      createDir(dirEntry, folders.slice(1),cb);
    } else {
			cb();
		}
  }, cb);
};


var writeFile=function(filename,buf,cb,context){
	var write=function(fileEntry){
		fileEntry.createWriter(function(fileWriter) {
			fileWriter.write(buf);
			fileWriter.onwriteend = function(e) {
				if (cb) cb.apply(cb,[buf.byteLength]);
			};
		}, console.error);
	}

	var getFile=function(filename){
		API.fs.root.getFile(filename, {exclusive:true}, function(fileEntry) {
			write(fileEntry);
		}, function(){
				API.fs.root.getFile(filename, {create:true,exclusive:true}, function(fileEntry) {
					write(fileEntry);
				});

		});
	}
	var slash=filename.lastIndexOf("/");
	if (slash>-1) {
		createDir(API.fs.root, filename.substr(0,slash).split("/"),function(){
			getFile(filename);
		});
	} else {
		getFile(filename);
	}
}

var readdir=function(cb,context) {
	var dirReader = API.fs.root.createReader();
	var out=[],that=this;
	dirReader.readEntries(function(entries) {
		if (entries.length) {
			for (var i = 0, entry; entry = entries[i]; ++i) {
				if (entry.isFile) {
					out.push([entry.name,entry.toURL ? entry.toURL() : entry.toURI()]);
				}
			}
		}
		API.files=out;
		if (cb) cb.apply(context,[out]);
	}, function(){
		if (cb) cb.apply(context,[null]);
	});
}
var getFileURL=function(filename) {
	if (!API.files ) return null;
	var file= API.files.filter(function(f){return f[0]==filename});
	if (file.length) return file[0][1];
}
var rm=function(filename,cb,context) {
	var url=getFileURL(filename);
	if (url) rmURL(url,cb,context);
	else if (cb) cb.apply(context,[false]);
}

var rmURL=function(filename,cb,context) {
	webkitResolveLocalFileSystemURL(filename, function(fileEntry) {
		fileEntry.remove(function() {
			if (cb) cb.apply(context,[true]);
		}, console.error);
	},  function(e){
		if (cb) cb.apply(context,[false]);//no such file
	});
}
function errorHandler(e) {
	console.error('Error: ' +e.name+ " "+e.message);
}
var initfs=function(grantedBytes,cb,context) {
	webkitRequestFileSystem(PERSISTENT, grantedBytes,  function(fs) {
		API.fs=fs;
		API.quota=grantedBytes;
		readdir(function(){
			API.initialized=true;
			cb.apply(context,[grantedBytes,fs]);
		},context);
	}, errorHandler);
}
var init=function(quota,cb,context) {
	navigator.webkitPersistentStorage.requestQuota(quota,
			function(grantedBytes) {
				initfs(grantedBytes,cb,context);
		}, errorHandler
	);
}
var queryQuota=function(cb,context) {
	var that=this;
	navigator.webkitPersistentStorage.queryUsageAndQuota(
	 function(usage,quota){
			initfs(quota,function(){
				cb.apply(context,[usage,quota]);
			},context);
	});
}
var API={
	init:init
	,readdir:readdir
	,checkUpdate:checkUpdate
	,rm:rm
	,rmURL:rmURL
	,getFileURL:getFileURL
	,writeFile:writeFile
	,readFile:readFile
	,download:download
	,get_head:get_head
	,get_date:get_date
	,get_size:get_size
	,getDownloadSize:get_size
	,queryQuota:queryQuota
}
module.exports=API;

},{}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\ksanagap.js":[function(require,module,exports){
(function (process){
var appname="installer";
if (typeof ksana=="undefined") {
	window.ksana={platform:"chrome"};
	if (typeof process!=="undefined" && 
		process.versions && process.versions["node-webkit"]) {
		window.ksana.platform="node-webkit";
	}
}
var switchApp=function(path) {
	var fs=require("fs");
	path="../"+path;
	appname=path;
	document.location.href= path+"/index.html"; 
	process.chdir(path);
}
var downloader={};
var rootPath="";

var deleteApp=function(app) {
	console.error("not allow on PC, do it in File Explorer/ Finder");
}
var username=function() {
	return "";
}
var useremail=function() {
	return ""
}
var runtime_version=function() {
	return "1.4";
}

//copy from liveupdate
var jsonp=function(url,dbid,callback,context) {
  var script=document.getElementById("jsonp2");
  if (script) {
    script.parentNode.removeChild(script);
  }
  window.jsonp_handler=function(data) {
    if (typeof data=="object") {
      data.dbid=dbid;
      callback.apply(context,[data]);    
    }  
  }
  window.jsonp_error_handler=function() {
    console.error("url unreachable",url);
    callback.apply(context,[null]);
  }
  script=document.createElement('script');
  script.setAttribute('id', "jsonp2");
  script.setAttribute('onerror', "jsonp_error_handler()");
  url=url+'?'+(new Date().getTime());
  script.setAttribute('src', url);
  document.getElementsByTagName('head')[0].appendChild(script); 
}


var loadKsanajs=function(){

	if (typeof process!="undefined" && !process.browser) {
		var ksanajs=require("fs").readFileSync("./ksana.js","utf8").trim();
		downloader=require("./downloader");
		ksana.js=JSON.parse(ksanajs.substring(14,ksanajs.length-1));
		rootPath=process.cwd();
		rootPath=require("path").resolve(rootPath,"..").replace(/\\/g,"/")+'/';
		ksana.ready=true;
	} else{
		var url=window.location.origin+window.location.pathname.replace("index.html","")+"ksana.js";
		jsonp(url,appname,function(data){
			ksana.js=data;
			ksana.ready=true;
		});
	}
}

loadKsanajs();

var boot=function(appId,cb) {
	if (typeof appId=="function") {
		cb=appId;
		appId="unknownapp";
	}
	if (!ksana.js && ksana.platform=="node-webkit") {
		loadKsanajs();
	}
	ksana.appId=appId;
	if (ksana.ready) {
		cb();
		return;
	}
	var timer=setInterval(function(){
			if (ksana.ready){
				clearInterval(timer);
				cb();
			}
		},100);
}


var ksanagap={
	platform:"node-webkit",
	startDownload:downloader.startDownload,
	downloadedByte:downloader.downloadedByte,
	downloadingFile:downloader.downloadingFile,
	cancelDownload:downloader.cancelDownload,
	doneDownload:downloader.doneDownload,
	switchApp:switchApp,
	rootPath:rootPath,
	deleteApp: deleteApp,
	username:username, //not support on PC
	useremail:username,
	runtime_version:runtime_version,
	boot:boot
}
module.exports=ksanagap;
}).call(this,require('_process'))

},{"./downloader":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\downloader.js","_process":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\process\\browser.js","fs":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\lib\\_empty.js","path":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\path-browserify\\index.js"}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\livereload.js":[function(require,module,exports){
var started=false;
var timer=null;
var bundledate=null;
var get_date=require("./html5fs").get_date;
var checkIfBundleUpdated=function() {
	get_date("bundle.js",function(date){
		if (bundledate &&bundledate!=date){
			location.reload();
		}
		bundledate=date;
	});
}
var livereload=function() {
	if(window.location.origin.indexOf("//127.0.0.1")===-1) return;

	if (started) return;

	timer1=setInterval(function(){
		checkIfBundleUpdated();
	},2000);
	started=true;
}

module.exports=livereload;
},{"./html5fs":"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\html5fs.js"}],"C:\\ksana2015\\node_modules\\ksana2015-webruntime\\mkdirp.js":[function(require,module,exports){
(function (process){
function mkdirP (p, mode, f, made) {
     var path = nodeRequire('path');
     var fs = nodeRequire('fs');
	
    if (typeof mode === 'function' || mode === undefined) {
        f = mode;
        mode = 0x1FF & (~process.umask());
    }
    if (!made) made = null;

    var cb = f || function () {};
    if (typeof mode === 'string') mode = parseInt(mode, 8);
    p = path.resolve(p);

    fs.mkdir(p, mode, function (er) {
        if (!er) {
            made = made || p;
            return cb(null, made);
        }
        switch (er.code) {
            case 'ENOENT':
                mkdirP(path.dirname(p), mode, function (er, made) {
                    if (er) cb(er, made);
                    else mkdirP(p, mode, cb, made);
                });
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                fs.stat(p, function (er2, stat) {
                    // if the stat fails, then that's super weird.
                    // let the original error be the failure reason.
                    if (er2 || !stat.isDirectory()) cb(er, made)
                    else cb(null, made);
                });
                break;
        }
    });
}

mkdirP.sync = function sync (p, mode, made) {
    var path = nodeRequire('path');
    var fs = nodeRequire('fs');
    if (mode === undefined) {
        mode = 0x1FF & (~process.umask());
    }
    if (!made) made = null;

    if (typeof mode === 'string') mode = parseInt(mode, 8);
    p = path.resolve(p);

    try {
        fs.mkdirSync(p, mode);
        made = made || p;
    }
    catch (err0) {
        switch (err0.code) {
            case 'ENOENT' :
                made = sync(path.dirname(p), mode, made);
                sync(p, mode, made);
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                var stat;
                try {
                    stat = fs.statSync(p);
                }
                catch (err1) {
                    throw err0;
                }
                if (!stat.isDirectory()) throw err0;
                break;
        }
    }

    return made;
};

module.exports = mkdirP.mkdirp = mkdirP.mkdirP = mkdirP;

}).call(this,require('_process'))

},{"_process":"C:\\Users\\chen\\AppData\\Roaming\\npm\\node_modules\\ksana-cli\\node_modules\\browserify\\node_modules\\process\\browser.js"}]},{},["C:\\ksana2015\\kage-glyph-sample\\index.js"])
//# sourceMappingURL=bundle.js.map
