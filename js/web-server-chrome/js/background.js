var _appobject = null;
function reload() { chrome.runtime.reload() }
chrome.runtime.onSuspend.addListener( function(evt) {})
chrome.runtime.onSuspendCanceled.addListener( function(evt) {})
chrome.app.window.onClosed.addListener(function(evt) {})
chrome.app.runtime.onLaunched.addListener(function(launchData) {
    function MainHandler() {
        BaseHandler.prototype.constructor.call(this)
    }
    _.extend(MainHandler.prototype, {
        get: function() {
            this.write('OK!, ' + this.request.uri)
        }
    })
    for (var key in BaseHandler.prototype) {
        MainHandler.prototype[key] = BaseHandler.prototype[key]
    }
});
function stopServer(){
    if(_appobject){
        _appobject.stop();
        setTimeout(function(){
            _appobject.close();
        },200)
    }
}
function statServer(flg,url,port){
    if(_appobject&&_appobject.stop){
        _appobject.close();
        setTimeout(function(){
            creatport();
        },500)
    }else{
        creatport();
    }
    function creatport(){
        var handlers = [
            ['.*', DirectoryEntryHandler]
        ]
        _appobject = new chrome.WebApplication({handlers:handlers, port:port})
        _appobject.start();
        if(!flg)openTab(url);
    }
}
function openTab(url){
    setTimeout(function(){
        window.open(url)
    },500);
}
