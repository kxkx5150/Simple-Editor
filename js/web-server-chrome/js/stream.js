var _SOCKID = null;
(function() {

    var peerSockMap = {}

    function onTCPReceive(info) {
        var sockId = info.socketId
        if (peerSockMap[sockId]) {
            peerSockMap[sockId].onReadTCP(info)
        }
    }
    function onTCPEroorReceive(info) {
        var sockId = info.socketId
        if (peerSockMap[sockId]) {
            peerSockMap[sockId].close()
        }
    }
    chrome.sockets.tcp.onReceive.addListener( onTCPReceive )
    chrome.sockets.tcp.onReceiveError.addListener( onTCPReceive )


    var sockets = chrome.sockets
    function IOStream(sockId) {
        _SOCKID = sockId;
        this.sockId = sockId
        peerSockMap[this.sockId] = this
        this.readCallback = null
        this.readUntilDelimiter = null
        this.readBuffer = new Buffer
        this.writeBuffer = new Buffer
        this.writing = false
        this.pleaseReadBytes = null

        this.remoteclosed = false
        this.closed = false
        this.onclose = null
        this.onWriteBufferEmpty = null
        chrome.sockets.tcp.setPaused(this.sockId, false, this.onUnpaused.bind(this))
    }

    IOStream.prototype = {
        onUnpaused: function(info) {
        },
        readUntil: function(delimiter, callback) {
            this.readUntilDelimiter = delimiter
            this.readCallback = callback
            //this.tryRead() // set unpaused instead
        },
        readBytes: function(numBytes, callback) {
            this.pleaseReadBytes = numBytes
            this.readCallback = callback
            this.checkBuffer()
            //this.tryRead() // set unpaused instead
        },
        tryWrite: function(callback) {
            if (this.writing) { 
                return
            }
            if (this.closed) { 
                return 
            }
            this.writing = true
            var data = this.writeBuffer.consume_any_max(4096)
            sockets.tcp.send( this.sockId, data, this.onWrite.bind(this, callback) )
        },
        onWrite: function(callback, evt) {
            // look at evt!
            if (evt.bytesWritten <= 0) {
                this.close()
            }
            this.writing = false
            if (this.writeBuffer.size() > 0) {
                if (this.closed) {
                } else {
                    this.tryWrite(callback)
                }
            } else {
                if (this.onWriteBufferEmpty) { this.onWriteBufferEmpty(); }
            }
        },
        onReadTCP: function(evt,eflg) {
            if(eflg){
                this.error({message:'error code',errno:evt.resultCode})
            }else if (evt.resultCode == 0) {
                this.remoteclosed = true
                if (this.halfclose) { this.halfclose() }
                if (this.request) {
                }
            } else if (evt.resultCode < 0) {
                this.error({message:'error code',errno:evt.resultCode})
            } else {
                this.readBuffer.add(evt.data)
                this.checkBuffer()
            }
        },

        log: function(msg,msg2,msg3) {
        },
        checkBuffer: function() {
            if (this.readUntilDelimiter) {
                var buf = this.readBuffer.flatten()
                var str = arrayBufferToString(buf)
                var idx = str.indexOf(this.readUntilDelimiter)
                if (idx != -1) {
                    var callback = this.readCallback
                    var toret = this.readBuffer.consume(idx+this.readUntilDelimiter.length)
                    this.readUntilDelimiter = null
                    this.readCallback = null
                    callback(toret)
                }
            } else if (this.pleaseReadBytes) {
                if (this.readBuffer.size() >= this.pleaseReadBytes) {
                    var data = this.readBuffer.consume(this.pleaseReadBytes)
                    var callback = this.readCallback
                    this.readCallback = null
                    this.pleaseReadBytes = null
                    callback(data)
                }
            }
        },
        close: function() {
            this.closed = true
            if(peerSockMap[this.sockId])delete peerSockMap[this.sockId];
            if (this.onclose) { this.onclose() }
            sockets.tcp.disconnect(this.sockId)
            this.sockId = null 
        },
        error: function(data) {
            if (! this.closed)this.close()
        },
        tryClose: function(callback) {
            if (! this.closed)return
            sockets.tcp.send(this.sockId, new ArrayBuffer, callback)
        }
    }
    window.IOStream = IOStream;
})()
