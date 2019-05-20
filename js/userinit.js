/********************************************** start */ (function(){ 





//Fired when the app is started. 
//Restart Editor for the changes to take effect.
/****************************************

    JavaScript Programming


    Ace editor API
    http://ace.c9.io/#nav=api


-----------simpleEditor API-----------
    
        tabobj = {
                    editor: Ace Editor
                    session: Ace Editor session
                    tabid: Integer
                    textid: Integer
                    title: String
                }

        textobj = {
                    change: Boolean
                    fentry: FileEntry
                    fullPath: FullPath
                    session: Ace Editor session
                    text: String 
                    textid: Integer
                };


========

    var tabobj = simpleEditor.getCurrentTab();
    var tabobj = simpleEditor.getTab(tabid);
    var tabobjs = simpleEditor.getAlltabs();

    var textobj = simpleEditor.getCurrentText();
    var textobj = simpleEditor.getText(tabid);
    var textobjs = simpleEditor.getAllText();

    var editor = simpleEditor.getCurrentEditor();
    var editor = simpleEditor.getEditor(tabid);

    var tabobj = simpleEditor.tabs[tabid]
    var textobj = simpleEditor.textobjs[textid]

========

    simpleEditor.createNewTab(text,callback)
    simpleEditor.selectTab(tabid)
    simpleEditor.removeTab(tabid)
    simpleEditor.saveTabText(tabid,saveas,callback)


************** Create User Menu


    simpleEditor.createUserMenu("User Menu",function(){
        
    });

************** Create WebView Button

    simpleEditor.createWebviewButton(Text,URL,UserAgent);

    *UserAgent optional


****************************************/



// Create New Tab
simpleEditor.createUserMenu("User Menu",function(){
    simpleEditor.createNewTab("")
});
// Create WebView Button
simpleEditor.createWebviewButton("Google","https://www.google.com","Mozilla/5.0 (Linux; Android 4.0.3; SC-02C Build/IML74K) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.58 Mobile Safari/537.31");
simpleEditor.createWebviewButton("Github","https://github.com/");




/************** Sidebar on right side
    var pelem = document.querySelector(".project-all-container");
    pelem.style.left = "initial";
    pelem.style.right = "1px";

    //Method overriding 
    simpleEditor.toggleProjectManager = function(force,statflg){
        if(!this.projectwidth || this.projectwidth < 10)this.projectwidth = 150;
        var cont = document.getElementById("editor-container");
        if(!force&&this.optobj.show_sidebar){
            this.optobj.show_sidebar = false;
            cont.classList.remove("class","open-manager")
            cont.style.left = 0;
            cont.style.right = 0;
            document.getElementsByClassName("project-all-container")[0].style.display ="none"
        }else{
            this.optobj.show_sidebar = true;
            cont.classList.add("class","open-manager")
            var val = this.projectwidth;
            cont.style.left = 0;
            cont.style.right = val-1+"px";
            var pcont = document.getElementsByClassName("project-all-container")[0];
            pcont.style.width = val+"px";
            pcont.style.display ="block"
        }
        if(!statflg)this.saveOptions();
    };
    simpleEditor.toggleProjectManager(true)

****************************************/













/********************************************** end */})();
