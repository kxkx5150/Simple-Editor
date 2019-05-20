var windowindex = 0;
var LAUNCHDATA = null;
var FILE_ENTRY_ = null;
chrome.app.runtime.onLaunched.addListener(function(LAUNCHDATA) {
    if(LAUNCHDATA&&LAUNCHDATA.items&&LAUNCHDATA.items[0]){
        FILE_ENTRY_ = LAUNCHDATA;
    }
    var wnds = chrome.app.window.getAll()
    if(wnds&&wnds.length > 0)return;
    launchSimpleEditor();
});
function launchSimpleEditor(wsize,cancel){
    if(wsize){
        var opts = {
            id:'editor'+windowindex,
            frame:"none",
            outerBounds:{
                minWidth:550,
                minHeight:400,
                width:wsize.w,
                height:wsize.h
            }
        };
    }else{
        var opts = {
            id:'editor'+windowindex,
            frame:"none",
            outerBounds:{
                minWidth:550,
                minHeight:400,
                width:900,
                height:600
            }
        };
    }
    if(cancel)return;
    chrome.app.window.create('editor.html',opts,function(mainWindow) {
        mainWindow.onClosed.addListener(function(evt) {
        	LAUNCHDATA = null;
        })
    });
    windowindex++;
}
