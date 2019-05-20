//Fired when a tab is created. 
//Restart Editor for the changes to take effect.
simpleEditor.addEditorScript = function(editor){


/******************************

	// quoting selected text. 
	var TXT = "";
	editor.session.on("change", function(e){
	    if(e.data.action === "removeText"){
			TXT = e.data.text;
			setTimeout(function(){
				TXT = "";
			},10)
	    }else if(e.data.action === "insertText"){
			if(TXT&&e.data.text === '"'){
				var txt = TXT;
				TXT = "";              
				editor.insert('"'+txt)
			}else if(TXT&&e.data.text === "'"){
				var txt = TXT;
				TXT = "";              
				editor.insert("'"+txt)				
			}
   	    } 
	})

/******************************/







};
