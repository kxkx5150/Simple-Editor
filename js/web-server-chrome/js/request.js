(function() {
    function Request(opts) {
        this.method = opts.method
        this.uri = opts.uri
        this.version = opts.version
        this.connection = opts.connection
        this.headers = opts.headers
        this.arguments = {}
        this.path = decodeURI(this.uri)
        this.origpath = this.path
        if (this.path[this.path.length-1] == '/') {
            this.path = this.path.slice(0,this.path.length-1)
        }   
    }
    Request.prototype = {
        isKeepAlive: function() {
            return this.headers['connection'] && this.headers['connection'].toLowerCase() != 'close'
        }
    }
    window.Request = Request
})()
