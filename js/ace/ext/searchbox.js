/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

define(function(require, exports, module) {
"use strict";

var dom = require("../lib/dom");
var lang = require("../lib/lang");
var event = require("../lib/event");
var searchboxCss = require("../requirejs/text!./searchbox.css");
var HashHandler = require("../keyboard/hash_handler").HashHandler;
var keyUtil = require("../lib/keys");
var Range = require("../range").Range;

dom.importCssString(searchboxCss, "ace_searchbox");

var html = '<div class="ace_search right">\
    <button type="button" action="hide" class="ace_searchbtn_close"></button>\
    <div class="ace_search_form">\
        <input class="ace_search_field" placeholder="Search for" spellcheck="false"></input>\
        <button type="button" action="findNext" class="ace_searchbtn next"></button>\
        <button type="button" action="findPrev" class="ace_searchbtn prev"></button>\
        <button type="button" action="findAll" class="ace_searchbtn" title="Alt-Enter">All</button>\
    </div>\
    <div class="ace_replace_form">\
        <input class="ace_search_field" placeholder="Replace with" spellcheck="false"></input>\
        <button type="button" action="replaceAndFindNext" class="ace_replacebtn">Replace</button>\
        <button type="button" action="replaceAll" class="ace_replacebtn">All</button>\
    </div>\
    <div class="ace_search_options">\
        <span action="toggleRegexpMode" class="ace_button" title="RegExp Search">.*</span>\
        <span action="toggleCaseSensitive" class="ace_button" title="CaseSensitive Search">Aa</span>\
        <span action="toggleWholeWords" class="ace_button" title="Whole Word Search">\\b</span>\
    </div>\
    <div class="ace_search_count">\
        <span class="search_count_info"></span>\
    </div>\
</div>'.replace(/>\s+/g, ">");

var SearchBox = function(editor, range, showReplaceForm) {
    var div = dom.createElement("div");
    div.innerHTML = html;
    this.element = div.firstChild;
    this.$init();
    this.setEditor(editor);
};

(function() {
    this.setEditor = function(editor) {
        editor.searchBox = this;
        editor.currentword = "";
        editor.container.appendChild(this.element);
        this.editor = editor;
    };

    this.$initElements = function(sb) {
        this.searchBox = sb.querySelector(".ace_search_form");
        this.replaceBox = sb.querySelector(".ace_replace_form");
        this.searchOptions = sb.querySelector(".ace_search_options");
        this.regExpOption = sb.querySelector("[action=toggleRegexpMode]");
        this.caseSensitiveOption = sb.querySelector("[action=toggleCaseSensitive]");
        this.wholeWordOption = sb.querySelector("[action=toggleWholeWords]");
        this.searchInput = this.searchBox.querySelector(".ace_search_field");
        this.replaceInput = this.replaceBox.querySelector(".ace_search_field");
    };
    
    this.$init = function() {
        var sb = this.element;
        
        this.$initElements(sb);
        
        var _this = this;
        event.addListener(sb, "mousedown", function(e) {
            setTimeout(function(){
                _this.activeInput.focus();
            }, 0);
            event.stopPropagation(e);
        });
        event.addListener(sb, "click", function(e) {
            var t = e.target || e.srcElement;
            var action = t.getAttribute("action");
            if (action && _this[action])
                _this[action]();
            else if (_this.$searchBarKb.commands[action])
                _this.$searchBarKb.commands[action].exec(_this);
            event.stopPropagation(e);
        });

        event.addCommandKeyListener(sb, function(e, hashId, keyCode) {
            var keyString = keyUtil.keyCodeToString(keyCode);
            var command = _this.$searchBarKb.findKeyCommand(hashId, keyString);
            if (command && command.exec) {
                command.exec(_this);
                event.stopEvent(e);
            }
        });

        this.$onChange = lang.delayedCall(function() {
            _this.find(false, false);
        });

        event.addListener(this.searchInput, "input", function() {
            _this.$onChange.schedule(20);
        });
        event.addListener(this.searchInput, "focus", function() {
            _this.activeInput = _this.searchInput;
            _this.searchInput.value && _this.highlight();
        });
        event.addListener(this.replaceInput, "focus", function() {
            _this.activeInput = _this.replaceInput;
            _this.searchInput.value && _this.highlight();
        });
        event.addListener(this.searchInput, "keydown", function(e) {
			var sh = simpleEditor.searchhistory;
			var sidx = simpleEditor.searchhistoryidx;
			_this.inputHistory(e,this,sh,sidx)
        });
    };
    //keybinging outsite of the searchbox
    this.$closeSearchBarKb = new HashHandler([{
        bindKey: "Esc",
        name: "closeSearchBar",
        exec: function(editor) {
            editor.searchBox.hide();
        }
    }]);

    //keybinging outsite of the searchbox
    this.$searchBarKb = new HashHandler();
    this.$searchBarKb.bindKeys({
        "Ctrl-f|Command-f|Ctrl-H|Command-Option-F": function(sb) {
            var isReplace = sb.isReplace = !sb.isReplace;
            sb.replaceBox.style.display = isReplace ? "" : "none";
            sb[isReplace ? "replaceInput" : "searchInput"].focus();
        },
        "Ctrl-G|Command-G": function(sb) {
            sb.findNext();
        },
        "Ctrl-Shift-G|Command-Shift-G": function(sb) {
            sb.findPrev();
        },
        "esc": function(sb) {
			sb.hide();
        },
        "Return": function(sb) {
            if (sb.activeInput == sb.replaceInput)
                sb.replace();
            sb.findNext();
        },
        "Shift-Return": function(sb) {
            if (sb.activeInput == sb.replaceInput)
                sb.replace();
            sb.findPrev();
        },
        "Alt-Return": function(sb) {
            if (sb.activeInput == sb.replaceInput)
                sb.replaceAll();
            sb.findAll();
        },
        "F3": function(sb) {
            sb.findNext();
        },
        "Tab": function(sb) {
            (sb.activeInput == sb.replaceInput ? sb.searchInput : sb.replaceInput).focus();
        }
    });

    this.$searchBarKb.addCommands([{
        name: "toggleRegexpMode",
        bindKey: {win: "Alt-R|Alt-/", mac: "Ctrl-Alt-R|Ctrl-Alt-/"},
        exec: function(sb) {
            sb.regExpOption.checked = !sb.regExpOption.checked;
            sb.$syncOptions();
        }
    }, {
        name: "toggleCaseSensitive",
        bindKey: {win: "Alt-C|Alt-I", mac: "Ctrl-Alt-R|Ctrl-Alt-I"},
        exec: function(sb) {
            sb.caseSensitiveOption.checked = !sb.caseSensitiveOption.checked;
            sb.$syncOptions();
        }
    }, {
        name: "toggleWholeWords",
        bindKey: {win: "Alt-B|Alt-W", mac: "Ctrl-Alt-B|Ctrl-Alt-W"},
        exec: function(sb) {
            sb.wholeWordOption.checked = !sb.wholeWordOption.checked;
            sb.$syncOptions();
        }
    }]);
    this.inputHistory = function(e,input,sh,sidx,rflg){
		if(sh.length > 1){
			if(e.keyCode === 38){
				if(sidx < 0){
					input.value = sh[sh.length-1]
					sidx = sh.length-1;
					if(rflg){
						simpleEditor.replacehistoryidx = sidx;
					}else{
						simpleEditor.searchhistoryidx = sidx;
						this.find();
					}
				}else if(sh[sidx-1]){
					input.value = sh[sidx-1]
					sidx--;
					if(rflg){
						simpleEditor.replacehistoryidx = sidx;
					}else{
						simpleEditor.searchhistoryidx = sidx;
						this.find();
					}
				}
				e.stopPropagation();
				e.preventDefault();
			}else if(e.keyCode === 40){
				if(sidx < 0){
					input.value = sh[0]
					sidx = 0;
					if(rflg){
						simpleEditor.replacehistoryidx = sidx;
					}else{
						simpleEditor.searchhistoryidx = sidx;
						this.find();
					}
				}else if(sh[sidx+1]){
					input.value = sh[sidx+1]
					sidx++;
					if(rflg){
						simpleEditor.replacehistoryidx = sidx;
					}else{
						simpleEditor.searchhistoryidx = sidx;
						this.find();
					}
				}
				e.stopPropagation();
				e.preventDefault();
			}
		}        	
    };
    this.$syncOptions = function() {
        dom.setCssClass(this.regExpOption, "checked", this.regExpOption.checked);
        dom.setCssClass(this.wholeWordOption, "checked", this.wholeWordOption.checked);
        dom.setCssClass(this.caseSensitiveOption, "checked", this.caseSensitiveOption.checked);
        this.find(false, false);
    };
    this.highlight = function(re) {
        this.editor.session.highlight(re || this.editor.$search.$options.re);
        this.editor.renderer.updateBackMarkers()
    };
    this.find = function(skipCurrent, backwards) {
    	var that = this;
        var srchwd = this.searchInput.value;
        var cases = this.caseSensitiveOption.checked;
        var range = this.editor.find(srchwd, {
            skipCurrent: skipCurrent,
            backwards: backwards,
            wrap: true,
            regExp: this.regExpOption.checked,
            caseSensitive: cases,
            wholeWord: this.wholeWordOption.checked
        });
        var noMatch = !range && this.searchInput.value;
        dom.setCssClass(this.searchBox, "ace_nomatch", noMatch);
        this.editor._emit("findSearchBox", { match: !noMatch });
        this.editor.currentword = srchwd;
        this.highlightLine(this.editor.currentword,this.editor);
        this.highlight();
        setTimeout(function(){
	        that.pushSearchHistory(srchwd);
        },0)
    };
    this.highlightLine = function(crntkeywd,editor){
        if(!simpleEditor.optobj.highlight_search_active || !crntkeywd)return;
        this.removehighlightLine();
        var session = editor.session;
        var itemcnt = editor.findAll(crntkeywd, {    
            regExp: this.regExpOption.checked,
            caseSensitive: this.caseSensitiveOption.checked,
            wholeWord: this.wholeWordOption.checked,
            countflg:session
        });
    	if(!itemcnt)return;
        for (var i = 0; i < itemcnt.length; i++) {
        	var item = itemcnt[i];
    		var start = item.start;
    		var end = item.end;
    		var r = new Range(start.row, start.column, end.row, end.column);
    		session.addMarker(r , "ace_search_highlight_word");
        };
        if(itemcnt&&itemcnt.length > 0){
	        this.setInfo(itemcnt.length,editor)
        }else{
	        this.removehighlightLine();
	        this.setInfo(0,editor)
        } 
    };
    this.removehighlightLine = function(){
        var editor = this.editor;
        var session = this.editor.session;
        var hitems = session.getMarkers()
		var keys = Object.keys(hitems);
		for (var i = 0, len = keys.length; i < len; i++) {
			var key = keys[i];
        	var item = hitems[key];
        	if(item.clazz === "ace_search_highlight_word"){
				session.removeMarker(item.id);
        	}
        };
    };
    this.removeAllMarker = function(){
    },
    this.removeEvent = function(){
    };
    this.setInfo =function(str,editor){
        var infoelems =  editor.searchBox.element.getElementsByClassName('search_count_info');
        if(infoelems.length < 1)return;
        infoelems[0].textContent = str;
    };
    this.findNext = function() {
        this.find(true, false);
    };
    this.findPrev = function() {
        this.find(true, true);
    };
    this.findAll = function(){
    	this.editor.currentword = "";
        var range = this.editor.findAll(this.searchInput.value, {    
            regExp: this.regExpOption.checked,
            caseSensitive: this.caseSensitiveOption.checked,
            wholeWord: this.wholeWordOption.checked
        });   
        var noMatch = !range && this.searchInput.value;
        dom.setCssClass(this.searchBox, "ace_nomatch", noMatch);
        this.editor._emit("findSearchBox", { match: !noMatch });
        this.highlight();
        this.hide();
        this.editor.focus();
        this.removehighlightLine();
    };
    this.replace = function() {
        if (!this.editor.getReadOnly()){
            this.editor.replace(this.replaceInput.value);
        }
    };    
    this.replaceAndFindNext = function() {
        if (!this.editor.getReadOnly()) {
            this.editor.replace(this.replaceInput.value);
            this.findNext()
        }
    };
    this.replaceAll = function() {
        if (!this.editor.getReadOnly()){
            this.editor.replaceAll(this.replaceInput.value);
        }
    };
    this.pushSearchHistory = function(srchwd){
        var sidx = simpleEditor.searchhistory.indexOf(srchwd);
        if(sidx === -1){
        	simpleEditor.searchhistory.push(srchwd);
        	if(simpleEditor.searchhistory.length > 100)simpleEditor.searchhistory.shift();
			simpleEditor.searchhistoryidx = simpleEditor.searchhistory.length-1;
        }else{
			simpleEditor.searchhistoryidx = sidx;
        }
    };
    this.pushReplaceHistory = function(srchwd){
        var sidx = simpleEditor.replacehistory.indexOf(srchwd);
        if(sidx === -1){
        	simpleEditor.replacehistory.push(srchwd);
        	if(simpleEditor.replacehistory.length > 100)simpleEditor.replacehistory.shift();
			simpleEditor.replacehistoryidx = simpleEditor.replacehistoryidx.length-1;
        }else{
			simpleEditor.replacehistoryidx = sidx;
        }
    };
    this.hide = function(flg) {
    	this.removeEvent();
        this.removehighlightLine();
    	this.editor.currentword = "";
        this.element.style.display = "none";
        this.editor.keyBinding.removeKeyboardHandler(this.$closeSearchBarKb);
        if(!flg)this.editor.focus();
    };
    this.show = function(value, isReplace) {
    	this.editor.currentword = "";
        var that = this,vflg = false;
        this.element.style.display = "";
        this.replaceBox.style.display = isReplace ? "" : "none";

        this.isReplace = isReplace;

        if (value){
            this.searchInput.value = value;
            vflg = true;
        }
        setTimeout(function(){
            that.searchInput.focus();
            that.searchInput.select();
        },120)
        this.editor.keyBinding.addKeyboardHandler(this.$closeSearchBarKb);
        this.setInfo("",this.editor)
        if(vflg)this.find(false,true);
    };
    this.isFocused = function() {
        var el = document.activeElement;
        return el == this.searchInput || el == this.replaceInput;
    }
}).call(SearchBox.prototype);

exports.SearchBox = SearchBox;

exports.Search = function(editor, isReplace) {
    var sb = editor.searchBox || new SearchBox(editor);
    sb.show(editor.session.getTextRange(), isReplace);
};

});


/* ------------------------------------------------------------------------------------------
 * TODO
 * --------------------------------------------------------------------------------------- */
/*
- move search form to the left if it masks current word
- includ all options that search has. ex: regex
- searchbox.searchbox is not that pretty. we should have just searchbox
- disable prev button if it makes sence
*/
