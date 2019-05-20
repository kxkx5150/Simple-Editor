function Buffer(opts) {
    this.opts = opts
    this.max_buffer_size = 104857600
    this._size = 0
    this.deque = []
}
Buffer.prototype = {
    clear: function() {
        this.deque = []
        this._size = 0
    },
    flatten: function() {
        if (this.deque.length == 1) { return this.deque[0] }
        var totalSz = 0
        for (var i=0; i<this.deque.length; i++) {
            totalSz += this.deque[i].byteLength
        }
        var arr = new Uint8Array(totalSz)
        var idx = 0
        for (var i=0; i<this.deque.length; i++) {
            arr.set(new Uint8Array(this.deque[i]), idx)
            idx += this.deque[i].byteLength
        }
        this.deque = [arr.buffer]
        return arr.buffer
    },
    add: function(data) {
        this._size = this._size + data.byteLength
        this.deque.push(data)
    },
    consume_any_max: function(maxsz) {
        if (this.size() <= maxsz) {
            return this.consume(this.size())
        } else {
            return this.consume(maxsz)
        }
    },
    consume: function(sz,putback) {
        if (sz > this._size) {
            return false
        }
        var consumed = 0
        var ret = new Uint8Array(sz)
        var curbuf

        while (consumed < sz) {
            curbuf = this.deque[0]

            if (consumed + curbuf.byteLength <= sz) {
                ret.set( new Uint8Array(curbuf), consumed )
                consumed = consumed + curbuf.byteLength
                this.deque.shift()
            } else {
                var sliceleft = new Uint8Array( curbuf, 0, sz - consumed )
                ret.set( sliceleft, consumed )

                var remainsz = curbuf.byteLength - (sz - consumed)
                var sliceright = new Uint8Array(curbuf, sz - consumed, remainsz)
                var remain = new Uint8Array(remainsz)
                remain.set(sliceright, 0)

                this.deque[0] = remain.buffer
                break
            }
        }
        if (putback) {
            this.deque = [ret.buffer].concat(this.deque)
        } else {
            this._size -= sz
        }
        return ret.buffer
    },
    size: function() {
        return this._size
    }
}
function test_buffer() {
    var b = new Buffer;
    b.add( new Uint8Array([1,2,3,4]).buffer )
    b.add( new Uint8Array([5,6,7]).buffer )
    b.add( new Uint8Array([8,9,10,11,12]).buffer )
    var data
    data = b.consume(1);
    data = b.consume(1);
    data = b.consume(2);
}

function test_buffer2() {
    var b = new Buffer;
    b.add( new Uint8Array([1,2,3,4]).buffer )
    b.add( new Uint8Array([5,6,7]).buffer )
    b.add( new Uint8Array([8,9,10,11,12]).buffer )
    var data
    data = b.consume(6);
    var adata = new Uint8Array(data)
}

function test_buffer3() {
    var b = new Buffer;
    b.add( new Uint8Array([1,2,3,4]).buffer )
    b.add( new Uint8Array([5,6,7]).buffer )
    b.add( new Uint8Array([8,9,10,11,12]).buffer )
    var data
    data = b.consume_any_max(1024);
    var adata = new Uint8Array(data)
}

function test_buffer4() {
    var b = new Buffer;
    b.add( new Uint8Array([1,2,3,4]).buffer )
    b.add( new Uint8Array([5,6,7]).buffer )
    b.add( new Uint8Array([8,9,10,11,12]).buffer )
    var data
    data = b.consume_any_max(10);
    var adata = new Uint8Array(data)
}
if (false) {
    test_buffer()
    test_buffer2()
    test_buffer3()
    test_buffer4()
}
