/***********************************************************
		Simple Editor
			Distributed under the BSD license:
			http://opensource.org/licenses/BSD-3-Clause

		Simple Editor based on Ace Editor
			http://ace.c9.io/
			https://github.com/ajaxorg/ace
************************************************************
		Copyright (c) 2015 Kunihiro Ando
			senna5150ando@gmail.com
        	2015-06-12T19:19:05Z
***********************************************************/

define(function (require, exports, module) {
	require("ace/ext/language_tools");
	require("ace/lib/fixoldbrowsers");
	require("ace/multi_select");
	// require("ace/ext/spellcheck");
	// require("ace/ext/emmet");
	require("./ace-lib/inline_editor");
	require("./ace-lib/dev_util");
	var snippetManager = require("ace/snippets").snippetManager;
	var config = require("ace/config"); config.init();
	var dom = require("ace/lib/dom");
	var net = require("ace/lib/net");
	var lang = require("ace/lib/lang");
	var useragent = require("ace/lib/useragent");
	var event = require("ace/lib/event");
	var EditSession = require("ace/edit_session").EditSession;
	var UndoManager = require("ace/undomanager").UndoManager;
	var HashHandler = require("ace/keyboard/hash_handler").HashHandler;
	var Renderer = require("ace/virtual_renderer").VirtualRenderer;
	var Editor = require("ace/editor").Editor;
	var whitespace = require("ace/ext/whitespace");
	var doclist = require("./ace-lib/doclist");
	var modelist = require("ace/ext/modelist");
	var themelist = require("ace/ext/themelist");
	var layout = require("./ace-lib/layout");
	var ElasticTabstopsLite = require("ace/ext/elastic_tabstops_lite").ElasticTabstopsLite;
	var IncrementalSearch = require("ace/incremental_search").IncrementalSearch;
	var workerModule = require("ace/worker/worker_client"); workerModule.WorkerClient = workerModule.UIWorkerClient;
	var beautify = require("ace/ext/beautify");
	var Split = require("ace/split").Split;
	TOKENIZER = require("ace/tokenizer").Tokenizer;
	CONFIG = config;
	LANG = lang;
	require(['ace/ace'], function (ace) {
		initSE(ace);
	});
	function initSE(ace) {
		simpleEditor = {
			optobj: {
				animate_scroll: false,
				display_indent_guides: true,
				enable_behaviours: false,
				fade_fold_widgets: false,
				search_backwards: true,
				tabsize: 4,
				folding: "true",
				fontfamily: "'Consolas','Inconsolata', 'Monaco', 'Menlo', 'Ubuntu Mono', 'source-code-pro', monospace",
				fontsize: "12px",
				fontsizepcnt: 100,
				lineheight: null,
				highlight_active: true,
				highlight_selected_word: true,
				keybinding: "ace",
				mode: "javascript",
				read_only: false,
				select_style: true,
				show_gutter: true,
				show_hidden: false,
				show_hscroll: false,
				show_print_margin: true,
				soft_tab: true,
				soft_wrap: "off",
				js_valid: true,
				live_auto: true,
				auto_save: false,
				show_bar: false,
				theme: "ace/theme/monokai",
				remember_open_files: false,
				server_port: 8999,
				charset_select: 0,
				show_sidebar: false,
				highlight_search_active: true,
				diff_style: 0,
				show_tabs: true,
				projectid: 0,
				storeprojectitems: {},
				gitusername: null,
				gituserpass: null,
				gitusermail: null,
				webview_width: null
			},
			savetimerid: null,
			savestatetimerid: null,
			readfoldertimerid: null,
			timerid: null,
			chktimerid: null,
			focustimerid: null,
			chklisttimerid: null,
			tabid: -1,
			textid: -1,
			tabs: [],
			textobjs: [],
			textentrys: {},
			selecttabid: -1,
			opentabs: 0,
			emptyflag: true,
			startupflag: true,
			zindex: 111,
			projectitems: [{}],
			projectwidth: 150,
			currentfolderentrys: [],
			confirmfunc: null,
			confirmsavefunc: null,
			diffpos: null,
			diffcurrentpos: 0,
			editproject: null,
			currentproject: null,
			preprojectid: -1,
			replaceallitems: [],
			markdowneditor: null,
			markdowntimerid: null,
			windowheight: window.innerHeight,
			contextmenutarget: null,
			showgoto: false,
			gotorange: null,
			gotosession: null,
			gotoelem: null,
			currentpanelmode: null,
			commands: [],
			gitdir: "zpxicvyk_128374____simple_editor_git__102983pqwoierpoity740918265",
			gitinfo: {},
			gitprojects: [],
			gitclonemode: false,
			appsid: chrome.i18n.getMessage("@@extension_id"),
			searchhistory: [],
			searchhistoryidx: -1,
			replacehistory: [],
			replacehistoryidx: -1,
			createTab: function (text, fentry, textid, fpath, cllbk, bllbk2) {
				var that = this;
				this.tabid++;
				var tabid = this.tabid;
				clearTimeout(this.chklisttimerid)
				this.chklisttimerid = setTimeout(function () {
					that.checkFileList();
				}, 300)
				if (!textid && textid !== 0) {
					if (!text) text = "";
					var textobj = {
						text: text,
						fullPath: null,
						textid: null,
						change: false,
						fentry: null
					};
					if (fentry) {
						if (this.emptyflag) this.removeAlltabs();
						this.emptyflag = false;
						var callback = function (displayPath) {
							if (!that.textentrys[displayPath]) {
								that.textid++;
								that.textentrys[displayPath] = { textid: that.textid };
								textobj.textid = that.textid;
								textobj.fentry = fentry;
								textobj.fullPath = displayPath;
								that.textobjs[that.textid] = textobj;
								var ftitle = textobj.fentry.name;
								textobj.session = settab(textobj.textid, ftitle, tabid, null, text, bllbk2);
							} else {
								var textid = that.textentrys[displayPath].textid;
								var txtobj = that.textobjs[textid];
								var ftitle = txtobj.fentry.name;
								settab(textid, ftitle, tabid, txtobj, text, bllbk2);
							}
						};
						if (fpath) {
							chrome.fileSystem.getDisplayPath(fentry, function (displayPath) {
								if (displayPath) {
									callback(displayPath);
								} else {
									callback(fpath);
								}
							});
						} else {
							chrome.fileSystem.getDisplayPath(fentry, function (displayPath) {
								callback(displayPath);
							});
						}
					} else {
						this.textid++;
						textobj.textid = this.textid;
						that.textobjs[that.textid] = textobj;
						var ttl = "Untitled";
						if (fpath) ttl = fpath;
						var session = settab(textobj.textid, ttl, tabid, null, text);
						textobj.session = session;
					}
				} else {
					var txtobj = that.textobjs[textid]
					var ftitle = "Untitled";
					if (txtobj.fentry) ftitle = txtobj.fentry.name;
					settab(textid, ftitle, tabid, txtobj, text);
				}
				if (cllbk) {
					setTimeout(function () {
						cllbk();
					}, 320);
				}
				function settab(textid, title, tabid, _textobj, etxt, bllbk2) {
					var filetype = that.checkFileType(title);
					if (_textobj) {
						var item = that.createEditor(tabid, filetype, true);
						var editor = item.editor;
						var session = _textobj.session;
						session = new ace.createEditSession(session.getDocument());
						editor.setSession(session);
					} else {
						var item = that.createEditor(tabid, filetype);
						var editor = item.editor;
						var session = editor.getSession();
					}

					var tab = {
						tabid: tabid,
						editor: editor,
						cmdLine: item.cmdLine,
						pre: item.pre,
						tabelem: that.createTabElement(tabid, title, textid),
						textid: textid,
						title: title,
						session: session,
						splitv: null,
						splith: null
					};
					that.tabs[tabid] = tab;
					session.setMode("ace/mode/" + filetype);
					var callback_settext = function () {
						if (_textobj) {
							if (_textobj.change) {
								var tabelem = document.getElementById("tabtitleNo" + tabid);
								if (tabelem) tabelem.classList.add("changetagclass");
								var listelem = document.getElementById("open-file-item-" + tabid);
								if (listelem) listelem.classList.add("open-file-item-change");
							}
						} else {
							var session = tab.editor.getSession();
							tab.editor.setValue(etxt, -1)
							session.setUndoManager(new UndoManager());
						}
						that.changeEditorTxt(editor, tab, tab.textid);
						if (bllbk2) bllbk2(editor)
					};
					setTimeout(function () {
						if (true) {
							callback_settext();
						} else {
							// customize theme ... beta
							// that.loadHighlightRules(null,editor,filetype,session,callback_settext);
						}
					}, 250)
					that.selectTab(tabid);
					that.adjustTab();
					clearTimeout(that.chktimerid)
					that.chktimerid = setTimeout(function () {
						that.checkCurrentFile();
					}, 600)
					return session;
				}
			},
			createEditor: function (tabid, filetype, sameflg) {
				var that = this;
				this.zindex++;
				var pre = document.createElement("div");
				document.getElementById("editor-container").appendChild(pre);
				pre.setAttribute("class", "editor");
				pre.setAttribute("id", "editor" + tabid);
				pre.style.zIndex = this.zindex;
				var editor = ace.edit("editor" + tabid);
				editor.renderer.setScrollMargin(8, that.windowheight, 3, 3)
				this.loadSettings(editor, sameflg);
				setTimeout(function () {
					if (that.addEditorScript) that.addEditorScript(editor)
				}, 0)
				setTimeout(function () {
					that.loadExtCustomKeys(editor, null, null, true);
				}, 250)
				if (this.optobj.show_bar) {
					var cmdLine = null;
					var consoleEl = dom.createElement("div");
					pre.parentNode.appendChild(consoleEl);
					consoleEl.style.cssText = "position:fixed;width:100%; bottom:1px; right:0;border:1px solid #baf; z-index:" + pre.style.zIndex + 1;
					cmdLine = new layout.singleLineEditor(consoleEl);
					cmdLine.editor = editor;
					editor.cmdLine = cmdLine;
					editor.showCommandLine = function (val) {
						this.cmdLine.focus();
						if (typeof val == "string")
							this.cmdLine.setValue(val, 1);
					};
					var StatusBar = require("ace/ext/statusbar").StatusBar;
					new StatusBar(editor, cmdLine.container);
				}
				if (this.optobj.isearch && dom) {
					var iSearchCheckbox = bindCheckbox("isearch", function (checked) {
						editor.setOption("useIncrementalSearch", checked);
					});
					editor.addEventListener('incrementalSearchSettingChanged', function (event) {
						iSearchCheckbox.checked = event.isEnabled;
					});
				}
				var item = {
					editor: editor,
					cmdLine: cmdLine,
					pre: pre
				};
				return item;
			},
			selectTab: function (tabid) {
				tabid = tabid - 0;
				var that = this, mflg = false;;
				var nitem = document.getElementById("tabtitleNo" + tabid);
				if (nitem) {
					var selt = document.body.querySelector(".selecttabsclass");
					if (selt) selt.classList.remove("selecttabsclass")
					this.zindex++
					nitem.classList.add("selecttabsclass")
					this.selecttabid = tabid;
				} else {
					return;
				}
				for (var i = 0; i < this.tabs.length; i++) {
					if (this.tabs[i]) {
						var etabid = this.tabs[i].tabid;
						if (etabid - 0 === tabid - 0) {
							mflg = true;
							var editor = that.tabs[tabid].editor;
							if (!editor) continue;
							editor.setReadOnly(false);
						} else {
							(function (etabid) {
								var editor = that.tabs[etabid].editor;
								if (!editor) return;
								setTimeout(function () {
									setTimeout(function () {
										editor.setReadOnly(true);
										editor.container.style.visibility = "hidden";
									}, 20);
									editor.clearSelection();
									editor.blur();
									editor.container.blur();
									editor.container.style.zIndex = 0;
									if (editor.completer && editor.completer.detach) editor.completer.detach();
								}, 30);
								if (editor.searchBox && editor.searchBox.hide) editor.searchBox.hide(true);
								if (that.tabs[etabid].cmdLine && that.tabs[etabid].cmdLine.container) that.tabs[etabid].cmdLine.container.style.display = "none";
							})(etabid - 0)
						}
						setTimeout(function () {
							if (mflg) {
								var editor = that.tabs[tabid].editor;
								if (!editor) return;
								editor.container.style.visibility = "visible";
								editor.container.style.zIndex = that.zindex;
								editor.focus();
								if (that.tabs[tabid].cmdLine && that.tabs[tabid].cmdLine.container) that.tabs[tabid].cmdLine.container.style.display = "block";
								editor.container.focus();
								var txtobj = that.textobjs[that.tabs[tabid].textid];
								if (txtobj && txtobj.fullPath) {
									var names = txtobj.fullPath.split("/");
									var name = names[names.length - 2];
									if (!name) return;
									for (var i = 0; i < that.gitprojects.length; i++) {
										if (that.gitprojects[i].name === name) {
											that.gitinfo.url = that.gitprojects[i].url;
											that.gitinfo.name = that.gitprojects[i].name;
											return;
										}
									};
								}
							}
						}, 50);
					}
				};
				var osellis = document.getElementsByClassName("open-file-item-select");
				for (var i = 0; i < osellis.length; i++) {
					osellis[i].classList.remove("open-file-item-select")
				};
				var selli = document.getElementById("open-file-item-" + tabid);
				if (selli) selli.classList.add("open-file-item-select")
			},
			checkFileList: function () {
				var prntnd = document.getElementById("project-open-container");
				$(prntnd).empty();
				var flg = false;
				var frg = document.createDocumentFragment();
				var lis = document.getElementsByClassName("tabsclass");
				for (var i = 0; i < lis.length; i++) {
					var liitem = lis[i];
					flg = false;
					if (liitem.classList.contains("selecttabsclass")) flg = true;
					var item = this.tabs[liitem.index]
					var change = false;
					var txt = this.textobjs[item.textid];
					if (txt && txt.change) change = true;
					frg.appendChild(this.createFileList(item, prntnd, flg, change));
				};
				prntnd.appendChild(frg)
			},
			createFileList: function (item, prntnd, flg, change) {
				var that = this;
				var li = document.createElement("li");
				prntnd.appendChild(li);
				li.setAttribute("class", "open-file-item");
				li.setAttribute("id", "open-file-item-" + item.tabid);
				li.setAttribute("data-tabid", item.tabid);
				var div = document.createElement("div");
				li.appendChild(div);
				li.addEventListener("click", function (e) {
					that.selectTab(this.getAttribute("data-tabid") - 0)
				}, false);
				if (this.textobjs && this.textobjs[item.textid] && this.textobjs[item.textid].fullPath) {
					li.setAttribute("title", this.textobjs[item.textid].fullPath);
				}

				if (flg) li.classList.add("open-file-item-select");
				if (change) li.classList.add("open-file-item-change");

				var close = document.createElement("span");
				div.appendChild(close);
				close.setAttribute("class", "close-file-icon");
				close.setAttribute("data-tabid", item.tabid);
				close.addEventListener("click", function (e) {
					e.stopPropagation()
					that.removeTab(this.getAttribute("data-tabid"))
				}, true);
				var fld = document.createElement("span");
				div.appendChild(fld);
				fld.setAttribute("class", "open-file-icon");

				var spanelm = document.createElement("label");
				div.appendChild(spanelm);
				spanelm.appendChild(document.createTextNode(item.title));
				return li;
			},
			loadSnippet: function (editor) {
				var session = editor.getSession();
				var emode = session.getMode().$id;
				if (!emode) return;
				chrome.storage.local.get("___snippets____" + emode, function (obj) {
					var sobj = obj["___snippets____" + emode];
					if (sobj) {
						var m = snippetManager.files[sobj.id];
						if (!m) return;
						m.snippetText = sobj.txt;
						if (!doclist["snippets/" + sobj.id]) {
							var s = doclist.initDoc(m.snippetText, "", {});
							s.setMode("ace/mode/snippets");
							doclist["snippets/" + sobj.id] = s;
						}
						snippetManager.unregister(m.snippets);
						m.snippets = snippetManager.parseSnippetFile(m.snippetText, m.scope);
						snippetManager.register(m.snippets);
					}
				})
			},
			loadHighlightRules: function (openflg, editor, mode, session, callback_settext) {
				var that = this;
				if (!editor) {
					editor = this.tabs[this.selecttabid].editor;
					session = editor.session;
				}
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				var checkfile = function () {
					windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
						fs.root.getFile("/customrules_" + mode + ".json", {}, function (fileEntry) {
							fileEntry.file(function (file) {
								if (openflg) {
									fileEntry.rules = true;
									fileEntry.moderules = mode;
									that.readFileEntry([fileEntry], 0, fileEntry.fullPath);
								} else {
									var reader = new FileReader();
									reader.onloadend = function (e) {
										setTimeout(function () {
											if (callback_settext) callback_settext();
										}, 280)
										var txt = this.result.replace(/\n+/g, "");
										txt = this.result.replace(/\{*https\:\/\/github\.com\/ajaxorg\/ace\/wiki\/Creating\-or\-Extending\-an\-Edit\-Mode*\}\,/g, "");
										if (!txt) return;
										var obj = JSON.parse(txt);
										if (!obj || obj.length < 0) return;
										var Mode = session.getMode();
										var nruless = Mode.$highlightRules;
										var nrls = nruless.$rules;
										if (mode === "javascript") {
											if (!nruless.$rules.no_regex) nruless.$rules.no_regex = [];
											for (var i = 0; i < obj.length; i++) {
												nruless.$rules.no_regex.unshift(obj[i])
											};
										} else {
											if (!nruless.$rules.start) nruless.$rules.start = [];
											for (var i = 0; i < obj.length; i++) {
												nruless.$rules.start.unshift(obj[i])
											};
										}
										var tk = new TOKENIZER(nruless.$rules);
										editor.session.$mode.$tokenizer = tk;
										editor.session.bgTokenizer.setTokenizer(tk);
									};
									reader.readAsText(file);
								}
							});
						}, function () {
							if (!openflg && callback_settext) callback_settext();
							var nruless = session.getMode().$highlightRules;

							if (mode === "javascript") {
								if (!nruless.$rules.no_regex) nruless.$rules.no_regex = [];
								var ary = nruless.$rules.no_regex;
							} else {
								if (!nruless.$rules.start) nruless.$rules.start = [];
								var ary = nruless.$rules.start;
							}
							var tokens = [
								{ token: "comment", regex: "aaaaa", caseInsensitive: false },
								{ token: "constant.language", regex: "bbbbb", caseInsensitive: false },
								{ token: "entity.other", regex: "ccccc", caseInsensitive: false },
								{ token: "invalid", regex: "ddddd", caseInsensitive: false },
								{ token: "keyword", regex: "eeeee", caseInsensitive: false },
								{ token: "markup.underline", regex: "fffff", caseInsensitive: false },
								{ token: "meta.storage.type", regex: "ggggg", caseInsensitive: false },
								{ token: "storage", regex: "hhhhh", caseInsensitive: false },
								{ token: "string", regex: "iiiii", caseInsensitive: false },
								{ token: "support.function", regex: "jjjjj", caseInsensitive: false },
								{ token: "variable", regex: "kkkkk", caseInsensitive: false }
							];
							var rlstxt = "{https://github.com/ajaxorg/ace/wiki/Creating-or-Extending-an-Edit-Mode}," + JSON.stringify(tokens);
							var blob = new Blob([rlstxt], { 'type': 'text/plain' });
							that.saveHighlightRules(openflg, blob, mode, rlstxt)
						});
					});
				};
				checkfile();
			},
			saveHighlightRules: function (callback, blob, mode, text) {
				var that = this;
				text = text.replace(/\n+/g, "");
				text = text.replace(/\}\,/g, "},\n")
				blob = new Blob([text], { 'type': 'text/plain' });
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/customrules_" + mode + ".json", { create: true, exclusive: false }, function (fileEntry) {
						fileEntry.createWriter(function (fileWriter) {
							fileWriter.onwriteend = function () {
								fileWriter.onwriteend = function () {
									if (callback) {
										setTimeout(function () {
											that.loadHighlightRules(true);
										}, 300)
									}
								};
								fileWriter.truncate(blob.size);
							};
							fileWriter.write(blob);
						});
					});
				});
			},
			loadDefaultKeys: function (editor, flg, startflg) {
				var that = this;
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				var write = function (flg) {
					var xhr = new XMLHttpRequest();
					xhr.open("GET", "js/customkey.js", true);
					xhr.onreadystatechange = function () {
						if ((xhr.readyState === 4) && (xhr.status == 200)) {
							var text = this.responseText;
							var blob = new Blob([text], { 'type': 'text/plain' });
							windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
								fs.root.getFile("/customkeys.js", { create: true, exclusive: false }, function (fileEntry) {
									fileEntry.createWriter(function (fileWriter) {
										fileWriter.onwriteend = function () {
											fileWriter.onwriteend = function () {
												fileEntry.file(function (file) {
													inject(file);
												});
											};
											fileWriter.truncate(blob.size);
										};
										fileWriter.write(blob);
									});
								});
							});
						}
					};
					xhr.send();
				};
				var inject = function (file) {
					if (editor) {
						that.callbackDefaultKeys(editor, startflg)
					} else {
						that.injectScript("custom-defaultkeys-js", file)
					}
				};
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/customkeys.js", {}, function (fileEntry) {
						if (flg) {
							fileEntry.defkeys = true;
							that.readFileEntry([fileEntry], 0, fileEntry.fullPath);
						} else {
							fileEntry.file(function (file) {
								inject(file);
							});
						}
					}, function () {
						write();
					});
				});
			},
			callbackDefaultKeys: function (editor, startflg) {
				var that = this;
				var callback = function (keys) {
					if (!editor) {
						if (that.tabs[that.selecttabid] && that.tabs[that.selecttabid].editor) {
							editor = that.tabs[that.selecttabid].editor;
						}
					}
					if (editor && keys && keys.length > 0) editor.commands.addCommands(keys);
					if (that.startupflag) {
						that.startupflag = false;
						chrome.storage.local.get("__open_project__", function (obj) {
							var item = obj["__open_project__"];
							if (!item) {
								chrome.runtime.getBackgroundPage(function (bg) {
									if (bg.FILE_ENTRY_ && bg.FILE_ENTRY_.items && bg.FILE_ENTRY_.items[0].entry) {
										var fentry = bg.FILE_ENTRY_.items[0].entry;
										bg.FILE_ENTRY_ = null;
										var cllbk = function () {
											var clbk = function () {
												that.checkFileEntry([fentry], null, null);
												that.pushHistory(fentry)
											};
											that.checkUserFileNameExtension(clbk)
										};
									} else {
										var cllbk = function () {
											var clbk = function () {
												if (that.optobj.remember_open_files) {
													that.setPreviousFiles();
												} else {
													that.createEmptyTab();
												}
											};
											that.checkUserFileNameExtension(clbk)
										};
									}
									setTimeout(function () {
										that.checkEditorScript(cllbk);
									}, 0)
									setTimeout(function () {
										that.checkUserInitScript();
									}, 500)
								});
							} else {
								chrome.storage.local.remove("__open_project__")
								if (item && item.folders) {
									that.openProjectEntry(item, 0, []);
								}
								var cllbk = function () {
									var clbk = function () {
										that.createEmptyTab();
									};
									that.checkUserFileNameExtension(clbk)
								};
								setTimeout(function () {
									that.checkEditorScript(cllbk);
								}, 0)
								setTimeout(function () {
									that.checkUserInitScript();
								}, 500)
							}
						})
					}
				};
				this.ACE_EDITOR_CUSTOM_KEYS(ace, that, callback);
			},
			saveDefaultKeys: function (fullPath, text, blob) {
				var that = this;
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/customkeys.js", { create: true, exclusive: false }, function (fileEntry) {
						fileEntry.createWriter(function (fileWriter) {
							fileWriter.onwriteend = function () {
								fileWriter.onwriteend = function () {
									that.loadDefaultKeys();
								};
								fileWriter.truncate(blob.size);
							};
							fileWriter.write(blob);
						});
					});
				});
			},
			loadUserInitScript: function (flg) {
				var that = this;
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/userinit.js", {}, function (fileEntry) {
						if (flg) {
							fileEntry.userinit = true;
							that.readFileEntry([fileEntry], 0, fileEntry.fullPath);
						} else {
							fileEntry.file(function (file) {
								var url = URL.createObjectURL(file)
								var js = document.createElement("script");
								js.type = "text/javascript";
								js.src = url;
								js.setAttribute("id", "__user_init_script___")
								document.body.appendChild(js);
							});
						}
					});
				});
			},
			saveUserInitScript: function (blob) {
				var that = this;
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/userinit.js", { create: true, exclusive: false }, function (fileEntry) {
						fileEntry.createWriter(function (fileWriter) {
							fileWriter.onwriteend = function () {
								fileWriter.onwriteend = function () { };
								fileWriter.truncate(blob.size);
							};
							fileWriter.write(blob);
						});
					});
				});
			},
			checkUserInitScript: function (startflg) {
				var that = this;
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/userinit.js", {}, function (fileEntry) {
						that.loadUserInitScript();
					}, function () {
						var xhr = new XMLHttpRequest();
						xhr.open("GET", "js/userinit.js", true);
						xhr.onreadystatechange = function () {
							if ((xhr.readyState === 4) && (xhr.status == 200)) {
								var txt = this.responseText;
								var blob = new Blob([txt], { 'type': 'text/plain' });
								that.saveUserInitScript(blob);
							}
						};
						xhr.send();
					});
				});
			},
			loadUserFileNameExtension: function (flg, callback) {
				var that = this;
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/fextensions.js", {}, function (fileEntry) {
						if (flg) {
							fileEntry.fnext = true;
							that.readFileEntry([fileEntry], 0, fileEntry.fullPath);
						} else {
							fileEntry.file(function (file) {
								var old = document.getElementById("__user_filename_extension___")
								if (old) $(old).remove();
								var url = URL.createObjectURL(file)
								var js = document.createElement("script");
								js.type = "text/javascript";
								js.src = url;
								js.setAttribute("id", "__user_filename_extension___")
								document.body.appendChild(js);
								if (callback) {
									setTimeout(function () {
										callback();
									}, 50);
								}
							});
						}
					});
				});
			},
			saveUserFileNameExtension: function (blob, callback) {
				var that = this;
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/fextensions.js", { create: true, exclusive: false }, function (fileEntry) {
						fileEntry.createWriter(function (fileWriter) {
							fileWriter.onwriteend = function () {
								fileWriter.onwriteend = function () {
									that.loadUserFileNameExtension(null, callback);
								};
								fileWriter.truncate(blob.size);
							};
							fileWriter.write(blob);
						});
					});
				});
			},
			checkUserFileNameExtension: function (callback) {
				var that = this;
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/fextensions.js", {}, function (fileEntry) {
						that.loadUserFileNameExtension(null, callback);
					}, function () {
						var xhr = new XMLHttpRequest();
						xhr.open("GET", "js/fextensions.js", true);
						xhr.onreadystatechange = function () {
							if ((xhr.readyState === 4) && (xhr.status == 200)) {
								var txt = this.responseText;
								var blob = new Blob([txt], { 'type': 'text/plain' });
								that.saveUserFileNameExtension(blob, callback);
							}
						};
						xhr.send();
					});
				});
			},
			loadEditorScript: function (flg, callback) {
				var that = this;
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/addeditor.js", {}, function (fileEntry) {
						if (flg) {
							fileEntry.editorscript = true;
							that.readFileEntry([fileEntry], 0, fileEntry.fullPath);
						} else {
							fileEntry.file(function (file) {
								var url = URL.createObjectURL(file)
								var js = document.createElement("script");
								js.type = "text/javascript";
								js.src = url;
								js.setAttribute("id", "__editor_script___")
								document.body.appendChild(js);
								setTimeout(function () {
									if (callback) callback();
								}, 200)
							});
						}
					});
				});
			},
			saveEditorScript: function (blob, callback) {
				var that = this;
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/addeditor.js", { create: true, exclusive: false }, function (fileEntry) {
						fileEntry.createWriter(function (fileWriter) {
							fileWriter.onwriteend = function () {
								fileWriter.onwriteend = function () {
									if (callback) callback();
								};
								fileWriter.truncate(blob.size);
							};
							fileWriter.write(blob);
						});
					});
				});
			},
			checkEditorScript: function (callback) {
				var that = this;
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/addeditor.js", {}, function (fileEntry) {
						that.loadEditorScript(null, callback);
					}, function () {
						var xhr = new XMLHttpRequest();
						xhr.open("GET", "js/addeditor.js", true);
						xhr.onreadystatechange = function () {
							if ((xhr.readyState === 4) && (xhr.status == 200)) {
								var txt = this.responseText;
								var blob = new Blob([txt], { 'type': 'text/plain' });
								that.saveEditorScript(blob, callback);
							}
						};
						xhr.send();
					});
				});
			},
			loadExtCustomKeys: function (editor, flg, startflg, nextflg) {
				var that = this;
				var loadkey = function (keys) {
					if (keys) {
						if (!editor && that.tabs[that.selecttabid] && that.tabs[that.selecttabid].editor) {
							editor = that.tabs[that.selecttabid].editor;
						}
						if (editor) editor.commands.addCommands(keys);
					}
				};
				var callback = function () {
					if (startflg) that.loadDefaultKeys(null, null, startflg);
					if (nextflg) {
						setTimeout(function () {
							that.loadDefaultKeys(editor);
						}, 200)
						setTimeout(function () {
							that.loadSnippet(editor);
						}, 250)
					}
				};
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/customkeys.json", {}, function (fileEntry) {
						if (flg) {
							fileEntry.keys = true;
							that.readFileEntry([fileEntry], 0, fileEntry.fullPath);
						} else {
							fileEntry.file(function (file) {
								var reader = new FileReader();
								reader.onloadend = function (e) {
									setTimeout(function () {
										if (callback) callback();
									}, 80)
									var obj = JSON.parse(this.result);
									for (var i = 0; i < obj.keys.length; i++) {
										(function (keys, i) {
											var item = keys[i];
											var command = item.command;
											item.exec = function () { that.actExtCustomKeys(command) };
											delete item.command;
											item.readOnly = true;
											if (i === keys.length - 1) loadkey(keys);
										})(obj.keys, i)
									};
								};
								reader.readAsText(file);
							});
						}
					});
				});
			},
			saveExtCustomKeys: function (callback, blob) {
				var that = this;
				if (!blob) {
					var text = this.createExtCustomKeys();
					blob = new Blob([text], { 'type': 'text/plain' });
				}
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/customkeys.json", { create: true, exclusive: false }, function (fileEntry) {
						fileEntry.createWriter(function (fileWriter) {
							fileWriter.onwriteend = function () {
								fileWriter.onwriteend = function () {
									if (callback) {
										callback();
									} else if (blob) {
										that.loadExtCustomKeys();
									}
								};
								fileWriter.truncate(blob.size);
							};
							fileWriter.write(blob);
						});
					});
				});
			},
			checkExtCustomKeys: function (startflg) {
				var that = this;
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					var callback = function () {
						that.loadExtCustomKeys(null, null, startflg);
					};
					fs.root.getFile("/customkeys.json", {}, function (fileEntry) {
						callback();
					}, function () {
						that.saveExtCustomKeys(callback);
					});
				});
			},
			actExtCustomKeys: function (arg, opt) {
				if (arg === "save_file") {
					var tabid = this.selecttabid;
					this.saveText(null, false, null, tabid)
				} else if (arg === "saveas_file") {
					var tabid = this.selecttabid;
					this.saveText(null, true, null, tabid)
				} else if (arg === "open_file") {
					this.__openfile();
				} else if (arg === "close_tab") {
					var tabid = this.selecttabid;
					this.removeTab(tabid);
				} else if (arg === "find_next") {
					var editor = this.tabs[this.selecttabid].editor;
					editor.searchBox.findNext();
				} else if (arg === "find_previous") {
					var editor = this.tabs[this.selecttabid].editor;
					if (editor.searchBox) editor.searchBox.findPrev();
				} else if (arg === "new_file") {
					this.createEmptyTab();
				} else if (arg === "toggle_sidebar") {
					this.toggleProjectManager();
				} else if (arg === "toggle_fullscreen") {
					this.setFullScreen();
				} else if (arg === "webview_preview") {
					this.toggleWebview();
				} else if (arg === "close_window") {
					chrome.app.window.current().close();
				} else if (arg === "google_search_selected_text") {
					var editor = this.tabs[this.selecttabid].editor;
					var swd = editor.getSession().doc.getTextRange(editor.selection.getRange());
					this.showWebView("https://www.google.com/search?q=" + encodeURIComponent(swd), "Mozilla/5.0 (Linux; Android 4.2.2; SC-04E Build/JDQ39) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.131 Mobile Safari/537.36");
				} else if (arg === "google_search_selected_text_PC") {
					var editor = this.tabs[this.selecttabid].editor;
					var swd = editor.getSession().doc.getTextRange(editor.selection.getRange());
					this.showWebView("https://www.google.com/search?q=" + encodeURIComponent(swd));
				} else if (arg === "google_search_selected_text_tab") {
					var editor = this.tabs[this.selecttabid].editor;
					var swd = editor.getSession().doc.getTextRange(editor.selection.getRange());
					chrome.browser.openTab({ url: "https://www.google.com/search?q=" + encodeURIComponent(swd) })
				} else if (arg === "select_next_tab") {
					var tabid = this.selecttabid;
					var li = document.getElementById("tabliNo" + tabid);
					if (li) {
						var nextli = li.nextSibling;
						if (nextli) {
							nextli.click();
						} else {
							nextli = li.parentNode.firstChild;
							if (nextli) nextli.click();
						}
					}
				} else if (arg === "select_previous_tab") {
					var tabid = this.selecttabid;
					var li = document.getElementById("tabliNo" + tabid);
					if (li) {
						var preli = li.previousSibling;
						if (preli) {
							preli.click();
						} else {
							preli = li.parentNode.lastChild;
							if (preli) preli.click();
						}
					}
				}
			},
			createExtCustomKeys: function (editor) {
				var keyobj = {
					"Available Commands": [
						"save_file",
						"saveas_file",
						"open_file",
						"close_tab",
						"new_file",
						"select_next_tab",
						"select_previous_tab",
						"toggle_sidebar",
						"close_window",
						"toggle_fullscreen",
						"webview_preview",
						"google_search_selected_text",
						"google_search_selected_text_PC",
						"google_search_selected_text_tab",
						null
					],
					"keys": [
						{
							Name: "saveFile",
							bindKey: {
								win: "Ctrl-S",
								mac: "Command-S"
							},
							command: "save_file"
						},
						{
							Name: "saveAsFile",
							bindKey: {
								win: "Ctrl-Alt-S",
								mac: "Command-Alt-S"
							},
							command: "saveas_file"
						}
					]
				};
				var text = JSON.stringify(keyobj);
				text = text.replace('"save_file",', '\t"save_file",\n');
				text = text.replace('"saveas_file",', '\t"saveas_file",\n');
				text = text.replace('"open_file",', '\t"open_file",\n');
				text = text.replace('"close_tab",', '\t"close_tab",\n');
				text = text.replace('"new_file",', '\t"new_file",\n');
				text = text.replace('"select_next_tab",', '\t"select_next_tab",\n');
				text = text.replace('"select_previous_tab",', '\t"select_previous_tab",\n');
				text = text.replace('"toggle_sidebar",', '\t"toggle_sidebar",\n');
				text = text.replace('"close_window",', '\t"close_window",\n');
				text = text.replace('"toggle_fullscreen",', '\t"toggle_fullscreen",\n');
				text = text.replace('"webview_preview",', '\t"webview_preview",\n');
				text = text.replace('"google_search_selected_text",', '\t"google_search_selected_text",\n');
				text = text.replace('"google_search_selected_text_PC",', '\t"google_search_selected_text_PC",\n');
				text = text.replace('"google_search_selected_text_tab",', '\t"google_search_selected_text_tab",\n');

				text = text.replace('null', '\tnull\n');
				text = text.replace('"keys":[', '\n\t"keys":[\n');
				text = text.replace(/\}\,\{/, "},\n{").replace(/\[/, "[\n").replace(/\]/, "\n]");
				text = text.replace(/\{\"Name\"\:/g, '\t\t{"Name":');
				text = text.replace(/\}\,\s\t\{\"Name\"\:/g, '\}\,\n\t\t\{\"Name\"\:');
				text = text.replace("]}", "\n\t]\n}");
				return text;
			},
			printTxt: function () {
				var editor = this.tabs[this.selecttabid].editor;
				ace.require("ace/config").loadModule("ace/ext/static_highlight", function (highlighter) {
					var session = editor.getSession();
					var pelem = highlighter.renderSync(session.getValue(), session.getMode(), editor.renderer.theme);
					var iframe = document.createElement("iframe");
					var doc = "<style>" + pelem.css + "</style>" + pelem.html;
					iframe.srcdoc = doc;
					iframe.style.display = "none";
					document.body.appendChild(iframe);
					iframe.onload = function () {
						iframe.contentWindow.print();
						setTimeout(function () {
							$(iframe).remove();
						}, 5000);
					};
				});
			},
			changeEditorTxt: function (editor, tabobj, textid) {
				var otabid = tabobj.tabid;
				var that = this;
				var session = editor.getSession();
				var func = function () {
					that.emptyflag = false;
					var txtobj = that.textobjs[textid];
					if (txtobj) {
						txtobj.change = true;
						if (txtobj.fentry && that.optobj.auto_save) that.autoSaveTxt(txtobj, otabid);
					}
					var tabelem = document.getElementById("tabtitleNo" + otabid);
					if (tabelem) tabelem.classList.add("changetagclass");
					var listelem = document.getElementById("open-file-item-" + otabid);
					if (listelem) listelem.classList.add("open-file-item-change");
					if (editor.searchBox && editor.searchBox.highlightLine) editor.searchBox.highlightLine(editor.currentword, editor);
				};
				tabobj.changefunc = func;
				session.on('change', tabobj.changefunc);
				setTimeout(function () {
					editor.commands.addCommands([{
						name: "a__a_aa_hide_Active_line",
						bindKey: { win: "Esc", mac: "Esc" },
						exec: function (ed) {
							if (ed && ed.searchBox && ed.searchBox.hide) ed.searchBox.hide();
						},
						readOnly: true
					}, {
						name: "toggle_goto",
						bindKey: { win: "Ctrl-P", mac: "Command-P" },
						exec: function (ed) {
							if (that.showgoto) {
								that.hideGoto();
							} else {
								that.showGoto();
							}
						},
						readOnly: true
					}])
				}, 100)
			},
			checkCurrentFile: function () {
				var that = this;
				var tabs = this.tabs, ary = [], fary = [];
				for (var i = 0; i < tabs.length; i++) {
					var item = tabs[i];
					if (!item) continue;
					if (ary.indexOf(item.textid) === -1) {
						ary.push(item.textid)
						var txtobj = this.textobjs[item.textid];
						if (txtobj && txtobj.fentry) {
							if (txtobj.fentry.theme) {
							} else if (txtobj.fentry.defkeys) {
							} else if (txtobj.fentry.keys) {
							} else if (txtobj.fentry.rules) {
							} else if (txtobj.fentry.ucom) {
							} else if (txtobj.fentry.userinit) {
							} else if (txtobj.fentry.editorscript) {
							} else if (txtobj.fentry.fnext) {
							} else {
								var fid = chrome.fileSystem.retainEntry(txtobj.fentry);
								fary.push(fid)
							}
						}
					}
				};
				setTimeout(function () {
					that.textentrys = {};
					for (var i = 0; i < ary.length; i++) {
						var pat = that.textobjs[ary[i]].fullPath;
						that.textentrys[pat] = { textid: ary[i] };
					};
				}, 0)
				var sobj = {};
				sobj["__pre__files"] = fary;
				chrome.storage.local.set(sobj);
			},
			autoSaveTxt: function (txtobj, otabid) {
				var that = this;
				clearTimeout(this.savetimerid)
				this.savetimerid = setTimeout(function () {
					chrome.fileSystem.isWritableEntry(txtobj.fentry, function (writeflg) {
						if (writeflg) that.saveText(null, null, null, otabid)
					});
				}, 2500);
			},
			insertTxt: function (txt) {
				var tab = this.tabs[this.selecttabid];
				if (tab) {
					var editor = tab.editor;
					editor.insert(txt);
				}
			},
			removeTab: function (tabid, createcancel) {
				tabid = tabid - 0;
				var that = this;
				var rtab = this.tabs[tabid]
				if (!rtab) return;
				var okfunc = function () {
					that.setSplitScreen(0, true, null, rtab)
					if (rtab.editor) {
						if (rtab.changefunc) {
							rtab.editor.getSession().removeListener('change', rtab.changefunc);
							rtab.changefunc = null;
						}
						rtab.editor.container.style.zIndex = 0;
						rtab.editor.blur()
						rtab.editor.destroy()
					}
					that.checkOpenFile(rtab);
					if (rtab.tabelem && rtab.tabelem.firstChild) $(rtab.tabelem.firstChild).fadeOut('fast', function () {
						$(rtab.tabelem).remove();
						$(rtab.pre).remove();
						if (rtab.cmdLine) {
							setTimeout(function () {
								rtab.cmdLine.editor.destroy();
							}, 0)
							setTimeout(function () {
								$(rtab.cmdLine.container).remove();
							}, 0)
						}
						clearTimeout(that.chklisttimerid)
						that.chklisttimerid = setTimeout(function () {
							that.checkFileList();
						}, 300)
						that.tabs[tabid] = null;
						if (tabid - 0 === that.selecttabid - 0) {
							var toptab = null, topzindex = -1;
							for (var i = 0; i < that.tabs.length; i++) {
								var item = that.tabs[i];
								if (!item || !item.editor || !item.editor.container) continue;
								var zidx = item.editor.container.style.zIndex;
								if (topzindex < zidx - 0) {
									topzindex = zidx;
									toptab = item;
								}
							};
							if (toptab && toptab.tabelem) {
								that.selectTab(toptab.tabelem.index - 0);
							}
							toptab = null;
						}
						that.opentabs--;
						if (that.opentabs < 1 && !createcancel) {
							that.createEmptyTab();
							that.emptyflag = true;
						}
						setTimeout(function () {
							that.checkCurrentFile();
						}, 10)
						clearTimeout(that.timerid)
						that.timerid = setTimeout(function () {
							that.adjustTab();
						}, 1400)
					});
				}
				if (rtab && this.textobjs[rtab.textid] && this.textobjs[rtab.textid].change) {
					var savefunc = function () {
						that.saveText(null, null, okfunc, rtab.textid);
					};
					this.confirmSave(okfunc, savefunc)
				} else {
					okfunc();
				}
			},
			confirmSave: function (okfunc, savefunc) {
				document.getElementById("alartModal").style.display = "block"
				this.confirmfunc = okfunc;
				this.confirmsavefunc = savefunc;

			},
			checkOpenFile: function (rtab) {
				var that = this;
				var rmtxtid = rtab.textid, cnt = 0;
				for (var i = 0; i < this.tabs.length; i++) {
					var item = this.tabs[i];
					if (!item) continue;
					if (item.textid === rmtxtid) {
						cnt++;
					}
				};
				if (cnt < 2) {
					if (!that.textobjs[rtab.textid] || !that.textobjs[rtab.textid].fullPath) return;
					var pat = that.textobjs[rtab.textid].fullPath;
					if (!that.textentrys[pat]) return;
					that.textentrys[pat] = null;
					delete that.textentrys[pat];
				}
			},
			createEmptyTab: function () {
				this.createTab();
			},
			setPreviousFiles: function () {
				var that = this;
				chrome.storage.local.get("__pre__files", function (obj) {
					var sobj = obj["__pre__files"];
					if (sobj && sobj[0]) {
						open(sobj, 0, [])
					}
				});
				chrome.storage.local.get("__pre__folder", function (obj) {
					var sobj = obj["__pre__folder"];
					if (sobj) {
						getentry(sobj, 0, [])
					}
				});
				var getentry = function (ary, idx, list) {
					if (!ary[idx]) {
						if (ary.length > 0) that.__openfolderexec(list, 0);
						return;
					}
					chrome.fileSystem.restoreEntry(ary[idx], function (fileEntry) {
						if (fileEntry) {
							list.push(fileEntry)
						}
						idx++
						getentry(ary, idx, list)
					});
				};
				var open = function (fids, idx, fentrys) {
					chrome.fileSystem.restoreEntry(fids[idx], function (fileEntry) {
						idx++;
						if (!fileEntry) {
							if (fids[idx]) {
								open(fids, idx, fentrys)
								return;
							}
						} else {
							fentrys.push(fileEntry)
							if (fids[idx]) {
								open(fids, idx, fentrys)
								return;
							}
						}
						if (fentrys.length < 1) {
							that.createEmptyTab();
						} else {
							that.checkFileEntry(fentrys);
						}
					});
				}
			},
			loadSettings: function (editor, sameflg) {
				var that = this;
				if (this.optobj) {
					if (this.optobj.keybinding == "ace") {
						editor.setKeyboardHandler();
					} else if (this.optobj.keybinding == "vim") {
						// editor.setOption("useIncrementalSearch",true);
						editor.setKeyboardHandler("ace/keyboard/" + this.optobj.keybinding);
					} else {
						editor.setOption("useIncrementalSearch", true);
						editor.setKeyboardHandler("ace/keyboard/" + this.optobj.keybinding);
					}
					editor.$blockScrolling = Infinity;
					var fntval = this.optobj.fontsize;
					if (this.optobj.fontsizepcnt && this.optobj.fontsizepcnt - 0 !== 100) fntval = this.optobj.fontsizepcnt + "%";
					editor.setOptions({
						fontFamily: this.optobj.fontfamily,
						fontSize: fntval,
						enableBasicAutocompletion: true,
						enableSnippets: true,
						enableLiveAutocompletion: this.optobj.live_auto
					});
					var cary = beautify.commands.concat(whitespace.commands)
					editor.commands.addCommands(cary);
					editor.renderer.setPadding(4);
					editor.setTheme(this.optobj.theme);
					editor.setShowFoldWidgets(JSON.parse(this.optobj.folding));
					editor.setSelectionStyle(this.optobj.select_style ? "line" : "text");
					editor.setHighlightActiveLine(this.optobj.highlight_active);
					editor.setShowInvisibles(this.optobj.show_hidden);
					editor.setDisplayIndentGuides(this.optobj.display_indent_guides);
					editor.renderer.setHScrollBarAlwaysVisible(this.optobj.show_hscroll);
					editor.setAnimatedScroll(this.optobj.animate_scroll);
					editor.renderer.setShowGutter(this.optobj.show_gutter);
					editor.renderer.setShowPrintMargin(this.optobj.show_print_margin);
					editor.setHighlightSelectedWord(this.optobj.highlight_selected_word);
					editor.setBehavioursEnabled(this.optobj.enable_behaviours);
					editor.setFadeFoldWidgets(this.optobj.fade_fold_widgets);
					editor.setOption("useElasticTabstops", this.optobj.elastic_tabstops);
					editor.setOption("useIncrementalSearch", this.optobj.isearch);
					editor.setReadOnly(this.optobj.read_only);

					var sesopt = function () {
						sameflg = false;
						switch (that.optobj.soft_wrap) {
							case "off":
								if (!sameflg) editor.session.setUseWrapMode(false);
								editor.renderer.setPrintMarginColumn(false);
								break;
							case "free":
								if (!sameflg) editor.session.setUseWrapMode(true);
								if (!sameflg) editor.session.setWrapLimitRange(null, null);
								editor.renderer.setPrintMarginColumn(false);
								break;
							default:
								if (!sameflg) editor.session.setUseWrapMode(true);
								var col = parseInt(that.optobj.soft_wrap, 10);
								if (!sameflg) editor.session.setWrapLimitRange(col, col);
								editor.renderer.setPrintMarginColumn(col);
						}
						if (!sameflg) editor.session.setUseWorker(that.optobj.js_valid)
						if (!sameflg) editor.session.setUseSoftTabs(that.optobj.soft_tab);
						if (!sameflg) editor.session.setTabSize(that.optobj.tabsize);
					};
					setTimeout(function () {
						sesopt();
					}, 2000)
					sesopt();
					this.loadCustomTheme(null, true);
				}
			},
			createTabElement: function (tabid, title, textid) {
				var that = this;
				var tabul = document.getElementById("tabul");
				var lielem = document.createElement("li");
				tabul.appendChild(lielem);
				lielem.setAttribute("id", "tabliNo" + tabid);
				lielem.setAttribute("class", "tabitems");
				lielem.index = tabid;
				lielem.addEventListener("click", function (e) {
					that.selectTab(tabid);
				});

				if (this.textobjs && this.textobjs[textid] && this.textobjs[textid].fullPath) {
					lielem.setAttribute("title", this.textobjs[textid].fullPath);
				}

				var a = document.createElement("a");
				lielem.appendChild(a);
				a.setAttribute("src", "#");
				a.setAttribute("class", "tabsclass");
				a.index = tabid;
				a.setAttribute("id", "tabtitleNo" + tabid);

				var paths = that.optobj.theme.split("/");
				var path = paths[paths.length - 1]
				path = "ace-" + path.replace("_", "-").replace("textmate", "tm");
				a.classList.add(path)

				var strdiv = document.createElement("div");
				a.appendChild(strdiv);
				strdiv.setAttribute("class", "tabstringclass");
				strdiv.appendChild(document.createTextNode(title));
				strdiv.setAttribute("id", "tabdivNo" + tabid);

				var imgdiv = document.createElement("div");
				a.appendChild(imgdiv);
				imgdiv.setAttribute("class", "tabcloseclass");
				var imgtg = document.createElement("img");
				imgdiv.appendChild(imgtg);
				imgtg.setAttribute("class", "imgbutton");
				imgtg.setAttribute("src", "img/close.png");
				imgtg.addEventListener("click", function (e) {
					e.stopPropagation();
					that.removeTab(tabid);
				}, true);
				imgtg.index = tabid;
				this.opentabs++;
				return lielem;
			},
			adjustTab: function () {
				var lis = document.querySelectorAll("li.tabitems");
				var len = lis.length;
				var maincont = document.getElementById("topmenucontainer");
				var rect = maincont.getBoundingClientRect();
				var width = parseInt((rect.width - 40) / len, 10);
				for (var i = 0; i < lis.length; i++) {
					lis[i].style.width = width + "px";
				};
			},
			removeAlltabs: function () {
				for (var i = 0; i < this.tabs.length; i++) {
					var tab = this.tabs[i];
					if (!tab) continue;
					this.removeTab(tab.tabid, true);
				};
			},
			resizeEditor: function () {
				this.adjustTab();
			},
			checkFileType: function (fname, strct) {
				var type = "";
				if (/\.(abp)$/i.test(fname)) {
					type = "abap"
				} else if (/\.(abc)$/i.test(fname)) {
					type = "abc"
				} else if (/\.(as)$/i.test(fname)) {
					type = "actionscript"
				} else if (/\.(ada)$/i.test(fname)) {
					type = "ada"
				} else if (/\.(adb)$/i.test(fname)) {
					type = "ada"
				} else if (/^(.htaccess)$/i.test(fname)) {
					type = "apache_conf"
				} else if (/^(.htgroups)$/i.test(fname)) {
					type = "apache_conf"
				} else if (/^(.htpasswd)$/i.test(fname)) {
					type = "apache_conf"
				} else if (/\.(conf)$/i.test(fname)) {
					type = "apache_conf"
				} else if (/\.(adoc)$/i.test(fname)) {
					type = "asciidoc"
				} else if (/\.(asciidoc)$/i.test(fname)) {
					type = "asciidoc"
				} else if (/\.(asm)$/i.test(fname)) {
					type = "assembly_x86"
				} else if (/\.(ahk)$/i.test(fname)) {
					type = "autohotkey"
				} else if (/\.(bat)$/i.test(fname)) {
					type = "batchfile"
				} else if (/\.(cmd)$/i.test(fname)) {
					type = "batchfile"
				} else if (/\.(c9search_results)$/i.test(fname)) {
					type = "c9Search"
				} else if (/\.(cpp)$/i.test(fname)) {
					type = "c_cpp"
				} else if (/\.(c)$/i.test(fname)) {
					type = "c_cpp"
				} else if (/\.(cc)$/i.test(fname)) {
					type = "c_cpp"
				} else if (/\.(cp)$/i.test(fname)) {
					type = "c_cpp"
				} else if (/\.(cxx)$/i.test(fname)) {
					type = "c_cpp"
				} else if (/\.(h)$/i.test(fname)) {
					type = "c_cpp"
				} else if (/\.(hh)$/i.test(fname)) {
					type = "c_cpp"
				} else if (/\.(hpp)$/i.test(fname)) {
					type = "c_cpp"
				} else if (/\.(cirru)$/i.test(fname)) {
					type = "cirru"
				} else if (/\.(cr)$/i.test(fname)) {
					type = "cirru"
				} else if (/\.(clj)$/i.test(fname)) {
					type = "clojure"
				} else if (/\.(cljs)$/i.test(fname)) {
					type = "clojure"
				} else if (/\.(cbl)$/i.test(fname)) {
					type = "cobol"
				} else if (/\.(cob)$/i.test(fname)) {
					type = "cobol"
				} else if (/\.(coffee)$/i.test(fname)) {
					type = "coffee"
				} else if (/\.(cf)$/i.test(fname)) {
					type = "coffee"
				} else if (/\.(cson)$/i.test(fname)) {
					type = "coffee"
				} else if (/\.(cfm)$/i.test(fname)) {
					type = "coldfusion"
				} else if (/\.(cs)$/i.test(fname)) {
					type = "csharp"
				} else if (/\.(css)$/i.test(fname)) {
					type = "css"
				} else if (/\.(curly)$/i.test(fname)) {
					type = "curly"
				} else if (/\.(d)$/i.test(fname)) {
					type = "d"
				} else if (/\.(di)$/i.test(fname)) {
					type = "d"
				} else if (/\.(dart)$/i.test(fname)) {
					type = "dart"
				} else if (/\.(diff)$/i.test(fname)) {
					type = "diff"
				} else if (/\.(patch)$/i.test(fname)) {
					type = "patch"
				} else if (/^(Dockerfile)$/i.test(fname)) {
					type = "dockerfile"
				} else if (/\.(dot)$/i.test(fname)) {
					type = "dot"
				} else if (/\.(e)$/i.test(fname)) {
					type = "eiffel"
				} else if (/\.(erl)$/i.test(fname)) {
					type = "erlang"
				} else if (/\.(hrl)$/i.test(fname)) {
					type = "erlang"
				} else if (/\.(ejs)$/i.test(fname)) {
					type = "ejs"
				} else if (/\.(ex)$/i.test(fname)) {
					type = "elixir"
				} else if (/\.(exs)$/i.test(fname)) {
					type = "elixir"
				} else if (/\.(frt)$/i.test(fname)) {
					type = "forth"
				} else if (/\.(fs)$/i.test(fname)) {
					type = "forth"
				} else if (/\.(ldr)$/i.test(fname)) {
					type = "forth"
				} else if (/\.(ftl)$/i.test(fname)) {
					type = "ftl"
				} else if (/\.(vert)$/i.test(fname)) {
					type = "glsl"
				} else if (/\.(frag)$/i.test(fname)) {
					type = "glsl"
				} else if (/\.(glsl)$/i.test(fname)) {
					type = "glsl"
				} else if (/\.(go)$/i.test(fname)) {
					type = "golang"
				} else if (/\.(groovy)$/i.test(fname)) {
					type = "groovy"
				} else if (/\.(haml)$/i.test(fname)) {
					type = "haml"
				} else if (/\.(hs)$/i.test(fname)) {
					type = "haskell"
				} else if (/\.(hx)$/i.test(fname)) {
					type = "haxe"
				} else if (/\.(html)$/i.test(fname)) {
					type = "html"
				} else if (/\.(htm)$/i.test(fname)) {
					type = "html"
				} else if (/\.(xhtml)$/i.test(fname)) {
					type = "html"
				} else if (/\.(erb)$/i.test(fname)) {
					type = "html_ruby"
				} else if (/\.(rhtml)$/i.test(fname)) {
					type = "html_ruby"
				} else if (/\.(ini)$/i.test(fname)) {
					type = "ini"
				} else if (/\.(jade)$/i.test(fname)) {
					type = "jade"
				} else if (/\.(java)$/i.test(fname)) {
					type = "java"
				} else if (/\.(js)$/i.test(fname)) {
					type = "javascript"
				} else if (/\.(json)$/i.test(fname)) {
					type = "json"
				} else if (/\.(jsx)$/i.test(fname)) {
					type = "jsx"
				} else if (/\.(jl)$/i.test(fname)) {
					type = "julia"
				} else if (/\.(tex)$/i.test(fname)) {
					type = "latex"
				} else if (/\.(latex)$/i.test(fname)) {
					type = "latex"
				} else if (/\.(less)$/i.test(fname)) {
					type = "less"
				} else if (/\.(lisp)$/i.test(fname)) {
					type = "lisp"
				} else if (/\.(ls)$/i.test(fname)) {
					type = "livescript"
				} else if (/\.(lua)$/i.test(fname)) {
					type = "lua"
				} else if (/\.(md)$/i.test(fname)) {
					type = "markdown"
				} else if (/\.(mz)$/i.test(fname)) {
					type = "maze"
				} else if (/\.(markdown)$/i.test(fname)) {
					type = "markdown"
				} else if (/\.(mysql)$/i.test(fname)) {
					type = "mysql"
				} else if (/\.(m)$/i.test(fname)) {
					type = "objectivec"
				} else if (/\.(mm)$/i.test(fname)) {
					type = "objectivec"
				} else if (/\.(ml)$/i.test(fname)) {
					type = "ocaml"
				} else if (/\.(mli)$/i.test(fname)) {
					type = "ocaml"
				} else if (/\.(pas)$/i.test(fname)) {
					type = "pascal"
				} else if (/\.(pl)$/i.test(fname)) {
					type = "perl"
				} else if (/\.(pm)$/i.test(fname)) {
					type = "perl"
				} else if (/\.(pgsql)$/i.test(fname)) {
					type = "pgsql"
				} else if (/\.(php)$/i.test(fname)) {
					type = "php"
				} else if (/\.(phtml)$/i.test(fname)) {
					type = "phtml"
				} else if (/\.(ps1)$/i.test(fname)) {
					type = "powershell"
				} else if (/\.(plg)$/i.test(fname)) {
					type = "prolog"
				} else if (/\.(prolog)$/i.test(fname)) {
					type = "prolog"
				} else if (/\.(properties)$/i.test(fname)) {
					type = "properties"
				} else if (/\.(py)$/i.test(fname)) {
					type = "python"
				} else if (/\.(r)$/i.test(fname)) {
					type = "r"
				} else if (/\.(rdoc)$/i.test(fname)) {
					type = "rdoc"
				} else if (/\.(rhtml)$/i.test(fname)) {
					type = "rhtml"
				} else if (/\.(rb)$/i.test(fname)) {
					type = "ruby"
				} else if (/\.(ru)$/i.test(fname)) {
					type = "ruby"
				} else if (/\.(gemspec)$/i.test(fname)) {
					type = "ruby"
				} else if (/\.(rake)$/i.test(fname)) {
					type = "ruby"
				} else if (/\.(rs)$/i.test(fname)) {
					type = "rust"
				} else if (/\.(sass)$/i.test(fname)) {
					type = "sass"
				} else if (/\.(scad)$/i.test(fname)) {
					type = "scad"
				} else if (/\.(scala)$/i.test(fname)) {
					type = "scala"
				} else if (/\.(scm)$/i.test(fname)) {
					type = "scheme"
				} else if (/\.(rkt)$/i.test(fname)) {
					type = "scheme"
				} else if (/\.(scss)$/i.test(fname)) {
					type = "scss"
				} else if (/\.(sh)$/i.test(fname)) {
					type = "sh"
				} else if (/\.(snippets)$/i.test(fname)) {
					type = "snippets"
				} else if (/\.(sql)$/i.test(fname)) {
					type = "sql"
				} else if (/\.(styl)$/i.test(fname)) {
					type = "stylus"
				} else if (/\.(svg)$/i.test(fname)) {
					type = "svg"
				} else if (/\.(swift)$/i.test(fname)) {
					type = "swift"
				} else if (/\.(tcl)$/i.test(fname)) {
					type = "tcl"
				} else if (/\.(tex)$/i.test(fname)) {
					type = "tex"
				} else if (/\.(txt)$/i.test(fname)) {
					type = "text"
				} else if (/\.(twig)$/i.test(fname)) {
					type = "twig"
				} else if (/\.(ts)$/i.test(fname)) {
					type = "typescript"
				} else if (/\.(vbs)$/i.test(fname)) {
					type = "vbscript"
				} else if (/\.(vm)$/i.test(fname)) {
					type = "velocity"
				} else if (/\.(xml)$/i.test(fname)) {
					type = "xml"
				} else if (/\.(rdf)$/i.test(fname)) {
					type = "xml"
				} else if (/\.(rss)$/i.test(fname)) {
					type = "xml"
				} else if (/\.(yaml)$/i.test(fname)) {
					type = "yaml"
				} else if (/\.(yml)$/i.test(fname)) {
					type = "yaml"
				} else if (/^Makefile$/i.test(fname)) {
					type = "makefile"
				} else {
					if (!strct) {
						type = "text"
					} else {
						if (fname.indexOf(".") === -1) {
							type = "text"
						}
					}
				}
				if (this.finename_extensions && this.finename_extensions.length > 0) {
					var utype = this.checkUserFileType(fname);
					if (utype) type = utype;
				}
				return type;
			},
			checkUserFileType: function (fname) {
				var exs = this.finename_extensions;
				for (var i = 0; i < exs.length; i++) {
					var item = exs[i];
					var rstr = item.extension;
					if (!rstr) continue;
					var regex = new RegExp(rstr, "i");
					if (regex.test(fname)) {
						if (item.mode) {
							return item.mode;
						} else {
							return;
						}
					}
				};
				return;
			},
			checkImageFileType: function (FileName) {
				var type = "";
				var fname = FileName.replace(/(jpg-large|jpg:large)/i, "jpg");
				if (/\.(jpe?g)$/i.test(fname)) {
					type = "jpg";
				} else if (/\.(png)$/i.test(fname)) {
					type = "png";
				} else if (/\.(gif)$/i.test(fname)) {
					type = "gif";
				} else if (/\.(bmp)$/i.test(fname)) {
					type = "bmp";
				} else if (/\.(webp)$/i.test(fname)) {
					type = "webp";
				}
				return type;
			},
			setNewView: function () {
				var toptab = this.tabs[this.selecttabid];
				if (toptab && toptab.tabelem) {
					this.createTab(null, null, toptab.textid)
				}
			},
			setSplitScreen: function (vh, rmflg, snippet, toptab, nfile, ntxtobj, nmode) {
				var id = null;
				var that = this;
				if (!toptab) toptab = this.tabs[this.selecttabid];
				if (toptab && toptab.tabelem) {
					var theme = this.optobj.theme;
					var mode = toptab.session.$modeId;
					if (snippet) id = toptab.editor.session.$mode.$id;
					var spltcnt = 2;
					if (toptab.splitv) {
						var split = toptab.splitv;
						spltcnt = split.getSplits() + 1;
						toptab.splitv = null;
						this.resetSplitScreen(split);
					}
					if (toptab.splith) {
						var split = toptab.splith;
						spltcnt = split.getSplits() + 1;
						toptab.splith = null;
						this.resetSplitScreen(split);
					}

					toptab.splittxt = null;
					toptab.splittxtobj = null;
					toptab.spliteditor = null;

					if (snippet) {
						var split = new Split(toptab.pre, theme, 1);
						split.setOrientation(0);
						split.setSplits(2);
						var editor2 = split.$editors[1];
						var m = snippetManager.files[id];
						if (!doclist["snippets/" + id]) {
							var text = m.snippetText;
							var s = doclist.initDoc(text, "", {});
							s.setMode("ace/mode/snippets");
							doclist["snippets/" + id] = s;
						}
						for (var i = 0; i < spltcnt; i++) {
							(function (i) {
								split.$editors[i].container.style.zIndex = 2147483640;
							})(i);
						}
						editor2.setSession(doclist["snippets/" + id], 1);
						editor2.focus();
						setTimeout(function () {
							editor2.on("blur", function () {
								editor2.removeAllListeners('blur');
								setTimeout(function () {
									var edtval = editor2.getValue();
									m.snippetText = edtval
									snippetManager.unregister(m.snippets);
									m.snippets = snippetManager.parseSnippetFile(m.snippetText, m.scope);
									snippetManager.register(m.snippets);
									var snpobj = {};
									snpobj.txt = edtval;
									snpobj.id = id;
									snpobj.snippets = m.snippets;
									snpobj.scope = m.scope;
									var obj = {};
									obj["___snippets____" + id] = snpobj;
									chrome.storage.local.set(obj)
									that.resetSplitScreen(split);
								}, 0);
							});
						}, 500)
					} else if (!rmflg) {
						var split = new Split(toptab.pre, theme, 1);
						split.setOrientation(vh);
						split.setSplits(spltcnt);

						for (var i = 0; i < spltcnt; i++) {
							(function (i, editor) {
								if ((ntxtobj || nfile) && spltcnt - 1 === i) {
									if (ntxtobj) {
										var ses = ntxtobj.session;
										ses.setMode(nmode)
										split.setSession(ses, i);
										toptab.splittxtobj = ntxtobj;
										toptab.spliteditor = editor;
									} else {
										var ssession = editor.getSession();
										ssession.setMode(nmode);
										editor.$blockScrolling = Infinity;
										editor.setValue(nfile, -1);
										toptab.splittxt = nfile;
										toptab.spliteditor = editor;
									}
								} else {
									var ses = new ace.createEditSession(toptab.session.getDocument());
									ses.setMode(mode)
									split.setSession(ses, i);
								}
								editor.container.style.zIndex = 2147483640;
								that.loadSettings(editor);
								setTimeout(function () {
									that.loadExtCustomKeys(editor, null, null, true);
								}, 250)
								if (i === 0) editor.focus();
							})(i, split.getEditor(i));
						}
						split.setTheme(theme)
						that.loadCustomTheme(null, true);
						var resizefunc = function () {
							split.resize()
						};
						split.resizefunc = resizefunc;
						window.addEventListener("resize", split.resizefunc);
						if (vh === 0) {
							toptab.splitv = split;
						} else {
							toptab.splith = split;
						}
					} else if (rmflg) {
						clearTimeout(that.focustimerid)
						that.focustimerid = setTimeout(function () {
							that.tabs[that.selecttabid].editor.focus();
						}, 200);
					}
				}
			},
			resetSplitScreen: function (split) {
				if (!split) return;
				var that = this;
				if (split.resizefunc) window.removeEventListener("resize", split.resizefunc);
				split.setSplits(1);
				for (var i = split.$editors.length - 1; i >= 0; i--) {
					var item = split.$editors[i]
					if (!item) continue;
					if (item.container) {
						item.container.style.display = "none";
					}
				};
			},
			setFullScreen: function () {
				var crntw = chrome.app.window.current();
				if (crntw.isMaximized() || crntw.isFullscreen()) {
					crntw.restore();
				} else {
					crntw.maximize();
				}
			},
			addHideHscrollbar: function (rmflg) {
				this.removeHideHscrollbar();
				if (rmflg) return;
				var style = document.createElement('style');
				style.type = 'text/css';
				style.textContent = '.ace_scrollbar-h{ display:none !important; }';
				style.setAttribute("class", "hide__scrollbar")
				document.getElementsByTagName('head')[0].appendChild(style);
			},
			removeHideHscrollbar: function () {
				var css = document.querySelector(".hide__scrollbar");
				if (css) (css).remove();
			},
			noItalic: function (rmflg) {
				this.removenoItalic();
				var style = document.createElement('style');
				style.type = 'text/css';
				style.textContent = '#editor-container *,#markdown-editor *{font-style: normal !important; }';
				style.setAttribute("class", "no_italic")
				document.getElementsByTagName('head')[0].appendChild(style);
			},
			removenoItalic: function () {
				var css = document.querySelector(".no_italic");
				if (css) $(css).remove();
			},
			setLineHeight: function (val) {
				this.removeLineHeight();
				var style = document.createElement('style');
				style.type = 'text/css';
				style.textContent = '.editor{line-Height:' + val + '!important; }';
				style.setAttribute("class", "editor_line_height")
				document.getElementsByTagName('head')[0].appendChild(style);
			},
			removeLineHeight: function () {
				var css = document.querySelector(".editor_line_height");
				if (css) $(css).remove();
			},
			setCustomTheme: function (name, text, blob) {
				var that = this;
				var paths = that.optobj.theme.split("/");
				var path = paths[paths.length - 1]
				var ocss = document.querySelector("#__user__theme___user_");
				if (ocss) $(ocss).remove();
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/" + path + ".css", { create: true, exclusive: false }, function (fileEntry) {
						fileEntry.createWriter(function (fileWriter) {
							dom.importCssString(text, "__user__theme___user_");
							fileWriter.onwriteend = function () {
								fileWriter.onwriteend = function () { }
								fileWriter.truncate(blob.size);
							};
							fileWriter.write(blob);
						});
					});
				});
			},
			loadCustomTheme: function (flg, late) {
				var time = 1000;
				if (late) time = 1000;
				var that = this;
				var paths = this.optobj.theme.split("/");
				var path = paths[paths.length - 1]
				var ocss = document.querySelector("#__user__theme___user_");
				if (ocss) $(ocss).remove();
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/" + path + ".css", {}, function (fileEntry) {
						if (flg) {
							fileEntry.theme = true;
							that.readFileEntry([fileEntry], 0, fileEntry.fullPath);
						} else {
							fileEntry.file(function (file) {
								var reader = new FileReader();
								reader.onloadend = function (e) {
									var that = this;
									setTimeout(function () {
										dom.importCssString(that.result, "__user__theme___user_");
									}, time)
								};
								reader.readAsText(file);
							});
						}
					}, function () {
						if (flg) {
							chrome.runtime.getPackageDirectoryEntry(function (direntry) {
								var pobj = {};
								pobj.children = [];
								that.onInitFs(direntry, [], that.optobj.theme + ".css", pobj, pobj);
							});
						}
					});
				});
			},
			removeCustomTheme: function () {
				var paths = this.optobj.theme.split("/");
				var path = paths[paths.length - 1]
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/" + path + ".css", { create: false }, function (fileEntry) {
						fileEntry.remove(function () {
							var ocss = document.querySelector("#__user__theme___user_");
							if (ocss) $(ocss).remove();
						}, function () { });
					}, function () { });
				});
			},
			loadUserCommand: function (flg) {
				var that = this;
				var inject = function (file) {
					that.injectScript("user-customcommand-js", file)
				};
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/usercomman.js", {}, function (fileEntry) {
						if (flg) {
							fileEntry.ucom = true;
							that.readFileEntry([fileEntry], 0, fileEntry.fullPath);
						} else {
							fileEntry.file(function (file) {
								inject(file)
							});
						}
					}, function () {
						var xhr = new XMLHttpRequest();
						xhr.open("GET", "js/command.js", true);
						xhr.onreadystatechange = function () {
							if ((xhr.readyState === 4) && (xhr.status == 200)) {
								var txt = this.responseText;
								that.saveUserCommand(txt)
							}
						};
						xhr.send();
					});
				});
			},
			callBackUserCommand: function () {
				var that = this;
				var callback = function (commands) {
					if (!commands || commands.length < 1) return;
					that.createUserCommand(commands);
				}
				this.ACE_EDITOR_USER_COMMANDS(ace, this, callback);
			},
			createUserCommand: function (commands) {
				var that = this;
				var ul = document.getElementById("ucom-container");
				$(ul).empty();
				createelm("Edit Command", true);
				createelm("Goto/Command Palette", false, false, false, false, true);
				createelm("Diff", false, true);
				createelm("Find", false, false, true);
				createelm("Markdown Editor", false, false, false, true);
				for (var i = 0; i < commands.length; i++) {
					createelm(commands[i].name);
				};
				function createelm(name, editflg, diffflg, findflg, mdflg, gotoflg) {
					var li = document.createElement("li");
					ul.appendChild(li);
					var a = document.createElement("a");
					a.setAttribute("href", "#");
					li.appendChild(a);
					var spn = document.createElement("span");
					spn.setAttribute("class", "modal-awesome-hinfo submenu");
					a.appendChild(spn);
					var lbl = document.createElement("label");
					spn.appendChild(lbl);
					lbl.textContent = name;
					li.setAttribute("data-hid", i);
					spn.setAttribute("data-hid", i);
					lbl.setAttribute("data-hid", i);
					if (editflg) lbl.style.color = "orange"
					if (diffflg) lbl.style.color = "violet"
					if (findflg) lbl.style.color = "violet"
					if (mdflg) {
						li.setAttribute("class", "menu-item-md")
						lbl.style.color = "violet"
					}
					if (gotoflg) lbl.style.color = "violet"
					li.addEventListener("mousedown", function () {
						if (editflg) {
							that.loadUserCommand(true);
						} else if (diffflg) {
							that.openAceDiff();
						} else if (mdflg) {
							that.openEditMarkdown();
						} else if (gotoflg) {
							that.showGoto();
						} else if (findflg) {
							var elem = document.getElementById("findModal");
							elem.style.display = "block";
							setTimeout(function () {
								elem.style.opacity = 1;
							}, 20);
						} else {
							clickelem(this)
						}
					}, false);
				}
				function clickelem(elem) {
					var idx = elem.getAttribute("data-hid");
					var command = commands[idx];
					if (!command || !command.exec) return;
					var editor = that.tabs[that.selecttabid].editor;
					command.exec(editor)
				}
			},
			saveUserCommand: function (text) {
				var that = this;
				var blob = new Blob([text], { 'type': 'text/plain' });
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile("/usercomman.js", { create: true, exclusive: false }, function (fileEntry) {
						fileEntry.createWriter(function (fileWriter) {
							fileWriter.onwriteend = function () {
								fileWriter.onwriteend = function () {
									that.loadUserCommand();
								}
								fileWriter.truncate(blob.size);
							};
							fileWriter.write(blob);
						});
					});
				});
			},
			injectScript: function (id, file) {
				var script = document.getElementById(id);
				if (script) $(script).remove();
				var url = URL.createObjectURL(file)
				var js = document.createElement("script");
				js.type = "text/javascript";
				js.src = url;
				js.setAttribute("id", id)
				document.body.appendChild(js);
			},
			openAceDiff: function () {
				var that = this;
				var crnteditor = this.tabs[this.selecttabid].editor;
				var txt = crnteditor.getValue();
				var mode = crnteditor.getSession().getMode();
				this.diffpos = null;
				this.diffcurrentpos = 0;
				document.getElementById("left-textarea").value = txt;
				document.getElementById("diffModal").style.display = "block"
				setTimeout(function () {
					document.getElementById("diffModal").style.opacity = 1;
				}, 180);
			},
			creatAceDiff: function () {
				var that = this;
				var ltxt = document.getElementById("left-textarea").value;
				var rtxt = document.getElementById("right-textarea").value
				var base = difflib.stringAsLines(ltxt);
				var newtxt = difflib.stringAsLines(rtxt);
				var sm = new difflib.SequenceMatcher(base, newtxt);
				var opcodes = sm.get_opcodes();

				this.diffpos = opcodes;
				this.diffcurrentpos = 0;

				var diffoutputdiv = document.getElementById("diff-main-container");
				$(diffoutputdiv).empty();
				diffoutputdiv.style.fontSize = this.optobj.fontsize;
				diffoutputdiv.style.fontFamily = this.optobj.fontfamily;
				diffoutputdiv.appendChild(diffview.buildView({
					baseTextLines: base,
					newTextLines: newtxt,
					opcodes: opcodes,
					baseTextName: "Base Text",
					newTextName: "New Text",
					contextSize: null,
					viewType: that.optobj.diff_style - 0
				}));
				document.getElementById('diff-text-container').style.display = "none";
				document.getElementById('diff-main-container').style.display = "block";
			},
			openTextAceDiff: function (right) {
				var that = this;
				chrome.fileSystem.chooseEntry({
					type: "openFile",
					acceptsMultiple: false
				}, function (fileEntries) {
					if (fileEntries && fileEntries.isFile) {
						that.diffpos = null;
						that.diffcurrentpos = 0;
						fileEntries.file(function (file) {
							var reader = new FileReader();
							reader.onloadend = function (e) {
								if (!right) {
									document.getElementById("left-textarea").value = this.result;
								} else {
									document.getElementById("right-textarea").value = this.result;
								}
							};
							reader.readAsText(file);
						})
					}
				});
			},
			nextAceDiff: function () {
				if (!this.diffpos) return;
				var crnt = this.diffcurrentpos;
				for (var i = crnt; i < this.diffpos.length; i++) {
					var item = this.diffpos[i];
					if (item[0] !== "equal") {
						var pos = 0;
						pos = item[1]
						this.diffcurrentpos = i + 1;
						if (this.diffcurrentpos > this.diffpos.length - 1) this.diffcurrentpos = this.diffpos.length - 1;
						this.setAceDiffPosition(pos, item);
						return;
					}
				};
			},
			preAceDiff: function () {
				if (!this.diffpos) return;
				var crnt = this.diffcurrentpos;
				for (var i = crnt; i >= 0; i--) {
					var item = this.diffpos[i];
					if (item[0] !== "equal") {
						var pos = 0;
						pos = item[1]
						this.diffcurrentpos = i - 1;
						if (this.diffcurrentpos < 1) this.diffcurrentpos = 0;
						this.setAceDiffPosition(pos, item);
						return;
					}
				};
			},
			setAceDiffPosition: function (pos, item) {
				var trs = document.querySelectorAll(".diff tbody tr");
				if (trs) {
					for (var i = 0; i < trs.length; i++) {
						var item = trs[i].querySelector("th");
						if (item.textContent - 0 == pos) {
							var mv = item.offsetTop;
							var objDiv = document.getElementById("diff-main-container");
							$(objDiv).scrollTop(mv);
							break;
						}
					};
				}
			},
			toggleProjectManager: function (force, statflg) {
				if (!this.projectwidth || this.projectwidth < 10) this.projectwidth = 150;
				var cont = document.getElementById("editor-container");
				if (!force && this.optobj.show_sidebar) {
					this.optobj.show_sidebar = false;
					cont.classList.remove("class", "open-manager")
					cont.style.left = 0;
					document.getElementsByClassName("project-all-container")[0].style.display = "none"
				} else {
					this.optobj.show_sidebar = true;
					cont.classList.add("class", "open-manager")
					var val = this.projectwidth;
					cont.style.left = (val - 0 + 1) + "px"
					var pcont = document.getElementsByClassName("project-all-container")[0];
					pcont.style.width = val + "px";
					pcont.style.display = "block"
				}
				if (!statflg) this.saveOptions();
			},
			resizeProjectManager: function (val) {
				var that = this;
				if (val < 50) val = 50;
				if (window.innerWidth - 50 < val) val = window.innerWidth - 50;
				var cont = document.getElementById("editor-container");
				cont.style.left = val + "px";
				document.getElementsByClassName("project-all-container")[0].style.width = val + "px";
				this.projectwidth = val;
				clearTimeout(this.savestatetimerid);
				this.savestatetimerid = setTimeout(function () {
					var sobj = {};
					sobj["_state_"] = val;
					chrome.storage.local.set(sobj);
				}, 400)
			},
			__openCharsetfile: function (e) {
				var that = this;
				chrome.fileSystem.chooseEntry({
					type: "openFile",
					acceptsMultiple: true
				}, function (fileEntries) {
					if (fileEntries && fileEntries.length > 0) {
						var charset = document.getElementById("char-set-select").value;
						that.checkFileEntry(fileEntries, null, null, charset);
						that.pushHistory(fileEntries[0])
					}
				});
			},
			__openfile: function (e, splitflg) {
				var that = this;
				chrome.fileSystem.chooseEntry({
					type: "openFile",
					acceptsMultiple: true
				}, function (fileEntries) {
					if (fileEntries && fileEntries.length > 0) {
						if (splitflg || splitflg === 0) {
							var filetype = "ace/mode/" + that.checkFileType(fileEntries[0].name);
							chrome.fileSystem.getDisplayPath(fileEntries[0], function (displayPath) {
								if (displayPath) {
									if (!that.textentrys[displayPath]) {
										fileEntries[0].file(function (file) {
											var reader = new FileReader();
											reader.onloadend = function (e) {
												that.setSplitScreen(splitflg, false, false, null, this.result, null, filetype)
											};
											reader.readAsText(file);
										});
									} else {
										var textid = that.textentrys[displayPath].textid;
										var txtobj = that.textobjs[textid];
										that.setSplitScreen(splitflg, false, false, null, null, txtobj, filetype)
									}
								}
							});
						} else {
							that.checkFileEntry(fileEntries, null, null);
							that.pushHistory(fileEntries[0])
						}
					}
				});
			},
			__insertfile: function () {
				var that = this;
				chrome.fileSystem.chooseEntry({
					type: "openFile",
					acceptsMultiple: false
				}, function (fileEntries) {
					if (fileEntries && fileEntries.isFile) {
						fileEntries.file(function (file) {
							var reader = new FileReader();
							reader.onloadend = function (e) {
								that.insertTxt(this.result)
							};
							reader.readAsText(file);
						});
					}
				});
			},
			__openfolder: function () {
				var that = this;
				chrome.fileSystem.chooseEntry({
					type: "openDirectory"
				}, function (fileEntrie) {
					if (fileEntrie) {
						that.__openfolderexec([fileEntrie], 0);
					}
				});
			},
			__openfolderexec: function (fileEntries, idx, pitem) {
				var fileEntrie = fileEntries[idx]
				if (!fileEntrie) return;
				var that = this;
				var callback = function () {
					var pobj = {};
					pobj.children = [];
					pobj.fentry = fileEntrie;
					pobj.name = fileEntrie.name;
					that.currentfolderentrys.push(fileEntrie);
					var fentryidx = that.currentfolderentrys.length - 1;
					that.projectitems[fentryidx - 0] = {};
					that.projectitems[fentryidx - 0][fileEntrie.fullPath] = fileEntrie;
					var cb = function (root) {
						that.createProject(root, null, fentryidx, pitem)
						if (idx === 0) that.toggleProjectManager(true);
						idx++;
						that.__openfolderexec(fileEntries, idx, pitem)
					};
					that.onInitFs(fileEntrie, [], null, pobj, pobj, cb, fentryidx);
					that.checkOpenFolder();
					that.pushHistory(fileEntrie)
				};
				callback();
			},
			__openZipfile: function () {
				var that = this;
				chrome.fileSystem.chooseEntry({
					type: "openFile",
					acceptsMultiple: false,
					accepts: [{
						extensions: ["zip", "crx"]
					}]
				}, function (fileEntries) {
					if (fileEntries && fileEntries.isFile) {
						fileEntries.file(function (item) {
							var reader = new FileReader();
							reader.onload = function (e) {
								that.readZipItems(e.target.result, fileEntries.name)
							};
							reader.readAsArrayBuffer(item);
						});
					}
				});
			},
			__openGithubURL: function (url, rname) {
				document.getElementById("loadingModal").style.display = "block"
				var that = this;
				var xhr = new XMLHttpRequest();
				xhr.open('GET', url, true);
				xhr.responseType = 'arraybuffer';
				xhr.onreadystatechange = function (e) {
					if (xhr.readyState == 4) {
						if (xhr.status == 200) {
							that.readZipItems(this.response, rname)
						} else {
							that.hideLoadingModal();
						}
					}
				};
				xhr.send(null);
			},
			readZipItems: function (arybf, rname) {
				var that = this;
				checkZip(arybf)
				function checkZip(arybf) {
					var nary = [], fldary = [];
					var jszip = new JSZip();
					var zipobj = jszip.load(arybf);
					for (var FileName in zipobj.files) {
						if (zipobj.files[FileName]._data) {
							var obj = {}
							var arybuf = zipobj.file(FileName).asUint8Array();
							var blob = new Blob([arybuf]);
							obj.name = FileName;
							obj.blob = blob;
							nary.push(obj)
						} else {
							var obj = {}
							obj.name = FileName;
							fldary.push(obj)
						}
					}
					var cmp = function (a, b) {
						return a.name.localeCompare(b.name);
					};
					if (fldary.length < 1) {
						createroot(nary, true);
					} else {
						fldary.sort(cmp);
						var itemary = fldary.concat(nary)
						createroot(itemary);
					}
				}
				function createroot(itemary, fileonly) {
					chrome.fileSystem.chooseEntry({
						type: "openDirectory"
					}, function (rootentry) {
						if (rootentry) {
							if (fileonly) {
								createfile(rootentry, itemary, 0, itemary[0].name, fileonly)
							} else {
								createfolder(rootentry, itemary, 0, itemary[0].name)
							}
						} else {
							that.hideLoadingModal();
						}
					});
				}
				function createfolder(rootentry, itemary, idx, name) {
					rootentry.getDirectory(name, { create: true }, function (dirEntry) {
						itemary[idx].dirEntry = dirEntry;
						idx++
						if (itemary[idx]) {
							if (itemary[idx].blob) {
								createfile(rootentry, itemary, idx, itemary[idx].name)
							} else {
								createfolder(rootentry, itemary, idx, itemary[idx].name)
							}
						} else {
							that.hideLoadingModal();
						}
					}, function () {
						that.hideLoadingModal();
					});
				}
				function createfile(rootentry, itemary, idx, name, fileonly) {
					rootentry.getFile(name, { create: true }, function (fileEntry) {
						fileEntry.createWriter(function (fileWriter) {
							fileWriter.onwriteend = function (e) {
								fileWriter.onwriteend = function () {
									if (fileonly) {
										setTimeout(function () {
											that.checkFileEntry([fileEntry], null, null);
										}, 100)
										that.hideLoadingModal();
									} else {
										idx++
										if (itemary[idx]) {
											createfile(rootentry, itemary, idx, itemary[idx].name)
										} else {
											setTimeout(function () {
												that.__openfolderexec([itemary[0].dirEntry], 0);
											}, 100)
											that.hideLoadingModal();
										}
									}
								};
								fileWriter.truncate(itemary[idx].blob.size);
							};
							fileWriter.write(itemary[idx].blob);
						}, function () {
							that.hideLoadingModal();
						});
					}, function () {
						that.hideLoadingModal();
					});
				}
			},
			hideLoadingModal: function () {
				document.getElementById("loadingModal").style.display = "none"
			},
			checkOpenFolder: function () {
				var that = this;
				var fidary = [];
				for (var i = 0; i < that.currentfolderentrys.length; i++) {
					var fileEntrie = that.currentfolderentrys[i]
					if (!fileEntrie) continue;
					var fid = chrome.fileSystem.retainEntry(fileEntrie);
					fidary.push(fid)
				};
				var sobj = {};
				sobj["__pre__folder"] = fidary;
				chrome.storage.local.set(sobj);
			},
			closefolder: function (prntnd, idx) {
				$(prntnd).empty();
				this.projectitems[idx - 0] = null;
				this.currentfolderentrys[idx - 0] = null;
				this.checkOpenFolder();
			},
			__dropLocalFile: function (e, flg) {
				var that = this;
				if (flg) {
					var fentry = flg;
					func();
				} else {
					var fentry = e.dataTransfer.items[0].webkitGetAsEntry();
					chrome.fileSystem.getWritableEntry(fentry, function (nfentry) {
						fentry = nfentry;
						func();
					})
				}
				function func() {
					if (fentry.isFile) {
						that.pushHistory(fentry);
						that.checkFileEntry([fentry]);
					} else {
						chrome.fileSystem.getDisplayPath(fentry, function (displayPath) {
							that.__openfolderexec([fentry], 0);
						});
					}
				}
			},
			onInitFs: function (fs, list, targetfile, pobj, root, cb, idx, find) {
				var that = this;
				clearTimeout(that.readfoldertimerid)
				var dirReader = fs.createReader();
				var entries = [];
				var cmp = function (a, b) { return a.name.localeCompare(b.name) };
				var readEntries = function () {
					clearTimeout(that.readfoldertimerid)
					dirReader.readEntries(function (results) {
						if (!results.length) {
							listResults(entries.sort(cmp));
						} else {
							entries = entries.concat(toArray(results));
							readEntries();
						}
					});
				};
				readEntries();
				function toArray(list) { return Array.prototype.slice.call(list || [], 0) }
				function listResults(entries) {
					var time = 1800;
					var fldary = [], fileary = [];
					for (var i = 0; i < entries.length; i++) {
						var item = entries[i];
						if (item.isFile) {
							fileary.push(item)
						} else {
							fldary.push(item)
						}
					};
					fileary = fileary.concat(fldary);
					for (var i = 0; i < fileary.length; i++) {
						clearTimeout(that.readfoldertimerid)
						var item = fileary[i];
						if (item.isFile) {
							if (targetfile) {
								if (item.fullPath.indexOf(targetfile) > -1) {
									if (item.fullPath.indexOf("/crxfs/js/ace/theme/") === 0) {
										item.theme = true;
										that.checkFileEntry([item], null, item.fullPath);
									}
									return;
								}
							} else if (find) {
								list.push(item);
								if (pobj) pobj.children.push(item);
							} else {
								if (that.projectitems[idx - 0]) that.projectitems[idx - 0][item.fullPath] = item;
								list.push(item);
								if (pobj) pobj.children.push(item);
							}
						} else {
							if (pobj) {
								pobj.children.push(item);
								item.children = [];
								if (that.projectitems[idx - 0]) that.projectitems[idx - 0][item.fullPath] = item;
							}
							that.onInitFs(item, list, targetfile, item, root, cb, idx, find)
						}
					};
					clearTimeout(that.readfoldertimerid)
					that.readfoldertimerid = setTimeout(function () {
						if (targetfile) {

						} else {
							if (cb) cb(root);
						}
					}, time);
				}
			},
			createProject: function (items, zipflg, idx, pitem, ul) {
				var that = this;
				var prntnd = document.getElementById("project-container");
				if (items.children.length < 1) return;

				if (ul) {
					var contul = ul;
				} else {
					var contul = document.createElement("ul");
					prntnd.appendChild(contul);
				}

				$(contul).empty();
				var div = document.createElement("div");
				contul.appendChild(div);
				div.setAttribute("class", "project-open-head");

				if (!zipflg) {
					var spanelm = document.createElement("span");
					div.appendChild(spanelm);
					spanelm.addEventListener("click", function () {
						that.closefolder(contul, idx)
					})
					spanelm.setAttribute("class", "close-folder-list")
				}

				if (!zipflg) {
					var spanelm = document.createElement("span");
					div.appendChild(spanelm);
					spanelm.setAttribute("class", "start_server")
					spanelm.addEventListener("click", function () {
						that.startServer(idx);
					})

					var reloadspn = document.createElement("span");
					div.appendChild(reloadspn);
					reloadspn.setAttribute("class", "reload_folder")
					reloadspn.setAttribute("id", "reload_folder" + idx)
					reloadspn.addEventListener("click", function () {
						that.reloadFolder(idx, contul);
					})

					var collapse = document.createElement("span");
					div.appendChild(collapse);
					collapse.setAttribute("class", "expand-project-folder")
					collapse.addEventListener("click", function () {
						var elem = document.getElementById("project_item_cont" + idx);
						if (elem) {
							if (elem.style.display !== "none") {
								elem.style.display = "none";
								collapse.classList.add("collapse-project-folder")
								if (pitem) {
									if (!pitem.collapse) pitem.collapse = {};
									pitem.collapse[idx] = true;
									that.optobj.storeprojectitems[pitem.id - 0] = pitem;
									that.saveOptions();
								}
							} else {
								elem.style.display = "block";
								collapse.classList.remove("collapse-project-folder")
								if (pitem) {
									if (!pitem.collapse) pitem.collapse = {};
									delete pitem.collapse[idx];
									that.optobj.storeprojectitems[pitem.id - 0] = pitem;
									that.saveOptions();
								}
							}
						}
					})
					var div = document.createElement("div");
					contul.appendChild(div);
					div.setAttribute("class", "project-open-subhead");
					var spanelm = document.createElement("span");
					div.appendChild(spanelm);
					spanelm.appendChild(document.createTextNode(items.name));
				}

				var prntnd = document.createElement("ul");
				contul.appendChild(prntnd);
				prntnd.setAttribute("id", "project_item_cont" + idx)
				that.createProjectItem(items.children, prntnd, zipflg, idx, pitem)

				if (pitem && pitem.collapse) {
					if (pitem.collapse[idx]) {
						var elem = document.getElementById("project_item_cont" + idx);
						if (elem) {
							elem.style.display = "none";
						}
						collapse.classList.add("collapse-project-folder")
					}
				}
			},
			createProjectItem: function (items, prntnd, zipflg, idx, pitem, firstflg) {
				var that = this;
				var len = items.length;
				for (var i = 0; i < len; i++) {
					var item = items[i];
					var li = document.createElement("li");

					if (firstflg) {
						prntnd.insertBefore(li, prntnd.firstChild);
					} else {
						prntnd.appendChild(li);
					}
					var div = document.createElement("div");
					li.appendChild(div);
					div.setAttribute("class", "subfolder-item");
					li.index = i;
					div.index = i;
					var b = document.createElement("b");
					div.appendChild(b);
					var spanelm = document.createElement("span");
					div.appendChild(spanelm);
					spanelm.appendChild(document.createTextNode(item.name));

					if (!item.children) {
						(function (div, li, item) {
							chrome.fileSystem.getDisplayPath(item, function (displayPath) {
								if (displayPath) {
									div.setAttribute("data-fpath", displayPath);
									li.setAttribute("data-fpath", displayPath);
									div.setAttribute("data-path", item.fullPath);
									li.setAttribute("data-path", item.fullPath);
								} else {
									div.setAttribute("data-fpath", item.fullPath);
									li.setAttribute("data-fpath", item.fullPath);
									div.setAttribute("data-path", item.fullPath);
									li.setAttribute("data-path", item.fullPath);
								}
							});
						})(div, li, item);

						li.setAttribute("data-pidx", idx);
						li.setAttribute("class", "project-file");
						b.style.visibility = "hidden";
						div.addEventListener("click", function (e) {
							that.clickProjectItem(this, idx - 0)
						});
						var imgflg = that.checkImageFileType(item.name)
						if (imgflg) div.setAttribute("data-img", "img");
						if (pitem) {
							(function (item, li, pitem) {
								setTimeout(function () {
									that.checkDisplayProjectItem(item, li, pitem);
								}, 0)
							})(item, li, pitem);
						}
					} else if (item.children) {
						li.style.color = "cadetblue"
						li.setAttribute("class", "project-folder");
						li.setAttribute("data-path", item.fullPath);
						li.setAttribute("data-pidx", idx);
						div.addEventListener("click", function (e) {
							that.clickProjectFolder(this)
						}, false)
						var contul = document.createElement("ul");
						li.appendChild(contul);
						div.classList.add("collapse-li");
						contul.setAttribute("class", "collapse-folder");
						if (pitem) {
							(function (item, li, pitem) {
								setTimeout(function () {
									that.checkDisplayProjectItem(item, li, pitem, true);
								}, 0)
							})(item, li, pitem);
						}
						that.createProjectItem(item.children, contul, zipflg, idx, pitem);
					}
				}
			},
			checkDisplayProjectItem: function (item, li, pitem, folder) {
				if (folder) {
					if (!pitem.exfldr) return;
					var ptrn = pitem.exfldr;
				} else {
					if (!pitem.extype) return;
					var ptrn = pitem.extype;
				}
				ptrn = ptrn.replace(/^\s+|\s+$/g, "").replace(/[\"\']/g, "").replace(/\*/g, "\.\*").replace(/\./g, '\\\.');
				ptrns = ptrn.split(",");
				for (var i = 0; i < ptrns.length; i++) {
					if (folder) {
						var rstr = "^" + ptrns[i] + "$";
						var regex = new RegExp(rstr);
					} else {
						var rstr = ptrns[i] + "$";
						var regex = new RegExp(rstr, "i");
					}
					if (regex.test(item.name)) {
						li.style.display = "none"
					}
				};
			},
			addProject: function () {
				var pobj = this.currentproject;
				var ninput = document.getElementById("project-name-input").value.replace(/^\s+|\s+$/g, "");
				var extinput = document.getElementById("project-ex-type").value.replace(/^\s+|\s+$/g, "");
				var exninput = document.getElementById("project-ex-name").value.replace(/^\s+|\s+$/g, "");
				var flist = [];
				for (var i = 0; i < pobj.folders.length; i++) {
					if (pobj.folders[i]) flist.push(pobj.folders[i]);
				};
				if (!ninput) ninput = "Project";
				pobj.name = ninput;
				pobj.folders = flist;
				pobj.extype = extinput;
				pobj.exfldr = exninput;
				if (flist.length < 1) {
					delete this.optobj.storeprojectitems[pobj.id - 0];
				} else {
					this.optobj.storeprojectitems[pobj.id - 0] = pobj;
				}
				this.optobj.projectid++;
				this.saveOptions();
				closeAddProjectModal.click();
			},
			addProjectFolder: function () {
				var that = this;
				chrome.fileSystem.chooseEntry({
					type: "openDirectory"
				}, function (fileEntrie) {
					if (fileEntrie) {
						var fid = chrome.fileSystem.retainEntry(fileEntrie);
						that.currentproject.folders.push(fid)
						that.currentproject.name = document.getElementById("project-name-input").value;
						that.currentproject.extype = document.getElementById("project-ex-type").value;
						that.currentproject.exfldr = document.getElementById("project-ex-name").value;
						that.openEditProject()
					}
				});
			},
			openEditProject: function () {
				var that = this;
				var pobj = this.currentproject;
				var modal = document.getElementById("addProjectModal");
				modal.style.display = "block";
				modal.style.opacity = 1;

				document.getElementById("project-name-input").value = pobj.name;
				document.getElementById("project-ex-type").value = pobj.extype;
				document.getElementById("project-ex-name").value = pobj.exfldr;

				var cont = document.getElementById("project-folder-list");
				$(cont).empty();
				var ary = pobj.folders;
				createlist(ary, 0)

				function createlist(ary, idx) {
					if (!ary || ary.length < 1) return;
					if (!ary[idx]) return;
					chrome.fileSystem.restoreEntry(ary[idx], function (fileEntry) {
						if (fileEntry) {
							var div = document.createElement("div");
							cont.appendChild(div);
							div.setAttribute("class", "project-item");

							var close = document.createElement("span");
							div.appendChild(close);
							close.setAttribute("class", "project-item-close");
							close.index = idx;
							close.addEventListener("click", clickClose, false);

							var spanelm = document.createElement("span");
							div.appendChild(spanelm);
							spanelm.appendChild(document.createTextNode(fileEntry.name));
						}
						idx++
						createlist(ary, idx)
					});
				}
				function clickClose() {
					var prnt = this.parentNode;
					var idx = this.index;
					ary[idx] = null;
					prnt.style.display = "none";
				}
			},
			openProjectItems: function () {
				var that = this;
				var cont = document.getElementById("open-project-folder-list");
				$(cont).empty();
				var modal = document.getElementById("openProjectModal");
				modal.style.display = "block";
				modal.style.opacity = 1;
				var obj = this.optobj.storeprojectitems;
				var keys = Object.keys(obj);
				for (var i = 0, len = keys.length; i < len; i++) {
					var item = obj[keys[i]];
					if (item && item.folders && item.folders.length > 0) {
						var div = document.createElement("div");
						cont.appendChild(div);
						div.setAttribute("class", "project-item");
						div.addEventListener("click", clickItem, false);
						div.index = item.id;

						var close = document.createElement("span");
						div.appendChild(close);
						close.setAttribute("class", "project-item-close");
						close.index = item.id;
						close.addEventListener("click", clickClose, false);

						var spanelm = document.createElement("span");
						div.appendChild(spanelm);
						spanelm.appendChild(document.createTextNode(item.name));
					}
				}
				function clickClose(e) {
					e.stopPropagation();
					var prnt = this.parentNode;
					var idx = this.index;
					delete that.optobj.storeprojectitems[idx - 0];
					prnt.style.display = "none";
					that.saveOptions();
				}
				function clickItem(e) {
					e.stopPropagation();
					var idx = this.index;
					var item = that.optobj.storeprojectitems[idx - 0];
					if (that.emptyflag && (that.preprojectid === -1)) {
						that.currentproject = item;
						that.openProjectEntry(item, 0, []);
						document.getElementById('closeOpenProjectModal').click();
					} else {
						var sobj = {};
						sobj["__open_project__"] = item;
						chrome.storage.local.set(sobj, function (obj) {
							chrome.runtime.getBackgroundPage(function (bg) {
								var crntw = chrome.app.window.current();
								bg.launchSimpleEditor({ w: crntw.outerBounds.width, h: crntw.outerBounds.height });
							});
						});
						document.getElementById('closeOpenProjectModal').click();
					}
				}
			},
			openProjectEntry: function (item, idx, list) {
				var that = this;
				if (!item.folders[idx]) {
					if (list.length > 0) {
						that.preprojectid = item.id;
						that.currentproject = item;
						that.__openfolderexec(list, 0, item);
					}
					return;
				}
				chrome.fileSystem.restoreEntry(item.folders[idx], function (fileEntry) {
					if (fileEntry) {
						list.push(fileEntry)
					}
					idx++
					that.openProjectEntry(item, idx, list)
				});
			},
			clickProjectFolder: function (elem) {
				if (elem.classList.contains("collapse-li")) {
					elem.classList.remove("collapse-li");
					var ul = elem.nextSibling;
					ul.classList.remove("collapse-folder")
					ul.style.display = "block";
					ul.style.marginTop = "-30px";
					setTimeout(function () {
						ul.style.marginTop = 0;
						ul.style.opacity = 1;
					}, 30)
				} else {
					elem.classList.add("collapse-li");
					var ul = elem.nextSibling;
					ul.classList.add("collapse-folder")
					ul.style.opacity = 0;
					setTimeout(function () {
						ul.style.marginTop = "-30px";
						ul.style.display = "none";
					}, 200)
				}
			},
			clickProjectItem: function (elem, idx) {
				var that = this;
				var imgflg = elem.getAttribute("data-img");
				var path = elem.getAttribute("data-path");
				var fpath = elem.getAttribute("data-fpath");
				if (imgflg) {
					var item = that.projectitems[idx - 0][path];
					item.file(function (file) {
						var url = URL.createObjectURL(file)
						var modal = document.getElementById("imageModal");
						document.getElementById("preview-image").src = url;
						modal.style.display = "block"
						setTimeout(function () {
							modal.style.opacity = 1;
						}, 50)
					})
				} else {
					var item = that.projectitems[idx - 0][path];
					if (path && item) {
						if (that.textentrys[fpath]) {
							var tid = that.textobjs[that.textentrys[fpath].textid].textid;
							var txtid = that.textobjs[that.textentrys[fpath].textid].textid;
							for (var i = 0; i < that.tabs.length; i++) {
								var item = that.tabs[i];
								if (item) {
									if (item && item.textid - 0 === txtid - 0) {
										that.selectTab(item.tabid - 0);
										return;
									}
								}
							};
						}
						that.readFileEntry([item], 0, path);
					}
				}
			},
			checkFileEntry: function (fileEntries, strct, targetfile, charset) {
				var that = this;
				var list = [];
				var flg = false;
				for (var i = 0; i < fileEntries.length; i++) {
					var item = fileEntries[i];
					if (targetfile && item.fullPath.indexOf(targetfile) > -1) {
						that.readFileEntry([item], 0, item.fullPath);
					} else if (this.checkFileType(item.name, strct)) {
						list.push(item);
					}
				};
				if (list.length > 0 && !targetfile) {
					that.readFileEntry(list, 0, null, charset);
				}
			},
			readFileEntry: function (fileEntrys, idx, fpath, charset) {
				var that = this;
				var callbak = function () {
					idx++;
					if (fileEntrys[idx]) that.readFileEntry(fileEntrys, idx, fpath);
				};
				if (charset) {
					fileEntrys[idx].file(function (file) {
						var reader = new FileReader();
						reader.onloadend = function (e) {
							var shiftjis = new TextDecoder(charset)
							var dectxt = shiftjis.decode(this.result);
							that.createTab(dectxt, fileEntrys[idx], null, fpath, callbak);
						};
						reader.readAsArrayBuffer(file);
					})
				} else {
					fileEntrys[idx].file(function (file) {
						var reader = new FileReader();
						reader.onloadend = function (e) {
							that.createTab(this.result, fileEntrys[idx], null, fpath, callbak);
						};
						reader.readAsText(file);
					});
				}
			},
			createHistoryItem: function () {
				var that = this;
				var ul = document.getElementById("history-container");
				chrome.storage.local.get("_history", function (result) {
					$(ul).empty();
					createelm("History", false, true);
					if (result["_history"]) {
						var historylist = result["_history"];
						for (var i = historylist.length - 1; i >= 0; i--) {
							createelm(historylist[i].name, historylist[i].id);
						};
					}
				});
				function createelm(txt, hid, hflg) {
					var li = document.createElement("li");
					ul.appendChild(li);
					var a = document.createElement("a");
					a.setAttribute("href", "#");
					li.appendChild(a);
					var spn = document.createElement("span");
					spn.setAttribute("class", "modal-awesome-hinfo submenu");
					a.appendChild(spn);
					var lbl = document.createElement("label");
					spn.appendChild(lbl);
					lbl.textContent = txt;
					if (hflg) lbl.style.color = "orange";
					if (hid) {
						li.setAttribute("data-hid", hid);
						spn.setAttribute("data-hid", hid);
						lbl.setAttribute("data-hid", hid);
						li.addEventListener("mousedown", function () {
							clickelem(this)
						}, false);
					}
				}
				function clickelem(elem) {
					var fid = elem.getAttribute("data-hid");
					chrome.fileSystem.restoreEntry(fid, function (isRestorable) {
						if (isRestorable) {
							chrome.fileSystem.restoreEntry(fid, function (fileEntry) {
								document.getElementById("history-container").style.left = "-9999px";
								setTimeout(function () {
									document.getElementById("history-container").style.left = "";
								}, 120);
								that.__dropLocalFile(null, fileEntry);
							});
						}
					});
				}
			},
			pushHistory: function (fileEntry) {
				var that = this;
				chrome.fileSystem.getDisplayPath(fileEntry, function (displayPath) {
					chrome.storage.local.get("_history", function (result) {
						var hlist = result["_history"];
						if (!hlist) {
							hlist = [];
						}
						var fid = chrome.fileSystem.retainEntry(fileEntry);
						var obj = {};
						obj.name = fileEntry.name;
						obj.path = displayPath;
						obj.id = fid;
						for (var i = 0; i < hlist.length; i++) {
							var item = hlist[i];
							if (item.path === obj.path) {
								var tmp = hlist.splice(i, 1);
								break;
							}
						};
						if (hlist.length > 9) {
							hlist.shift()
						}
						hlist.push(obj);
						var sobj = {};
						sobj["_history"] = hlist;
						chrome.storage.local.set(sobj, function () {
							that.createHistoryItem();
						});
					});
				});
			},
			checkChangeFlag: function () {
				var that = this;
				var crnttabid = that.selecttabid;
				var txtidary = [], tabidary = [], ntabidary = [];
				for (var i = 0; i < that.tabs.length; i++) {
					var item = that.tabs[i];
					if (!item) continue;
					if (txtidary.indexOf(item.textid) === -1) {
						var txtitem = that.textobjs[item.textid];
						txtidary.push(item.textid);
						if (txtitem.change) {
							tabidary.push(item.tabid)
						}
					}
				};
				if (tabidary.length > 0) {
					return true;
				}
				return;
			},
			saveAllText: function () {
				var that = this;
				var crnttabid = that.selecttabid;
				var txtidary = [], tabidary = [], ntabidary = [];
				for (var i = 0; i < that.tabs.length; i++) {
					var item = that.tabs[i];
					if (!item) continue;
					if (txtidary.indexOf(item.textid) === -1) {
						var txtitem = that.textobjs[item.textid];
						txtidary.push(item.textid);
						if (txtitem.change) {
							if (txtitem.fentry) {
								tabidary.push(item.tabid)
							} else {
								ntabidary.push(item.tabid)
							}
						}
					}
				};
				tabidary = tabidary.concat(ntabidary);
				if (tabidary.length > 0) {
					var selts = document.getElementsByClassName("changetagclass");
					for (var i = 0; i < selts.length; i++) {
						selts[i].classList.remove("changetagclass")
					};
					var selts = document.getElementsByClassName("open-file-item-change");
					for (var i = 0; i < selts.length; i++) {
						selts[i].classList.remove("open-file-item-change")
					};
					var idx = -1;
					var callbak = function () {
						idx++;
						var tabid = tabidary[idx];
						if (tabid || tabid === 0) {
							that.selectTab(tabid)
							setTimeout(function () {
								that.saveText(null, null, callbak);
							}, 30);
						} else {
							if (crnttabid || crnttabid === 0) that.selectTab(crnttabid)
						}
					};
					callbak();
				}
			},
			clearChangeTabState: function (toptab, fileEntry, text, splitflg) {
				var that = this;
				if (splitflg) {
					var txtobj = splitflg;
				} else {
					var txtobj = that.textobjs[that.tabs[toptab.tabid].textid];
				}
				if (txtobj) {
					txtobj.change = false;
					txtobj.fentry = fileEntry;
					txtobj.text = text;
					if (!splitflg) {
						if (!toptab | (!toptab.tabid && toptab.tabid !== 0)) return;
						var tabelem = document.getElementById("tabtitleNo" + toptab.tabid);
						if (tabelem) tabelem.classList.remove("changetagclass");
						var listelem = document.getElementById("open-file-item-" + toptab.tabid);
						if (listelem) listelem.classList.remove("open-file-item-change");
					}
					setTimeout(function () {
						chrome.fileSystem.getDisplayPath(fileEntry, function (displayPath) {
							txtobj.fullPath = displayPath;
						});
					}, 0)
				}
				setTimeout(function () {
					if (splitflg) {
						var crnttxtid = txtobj.textid;
					} else {
						var crnttxtid = that.textobjs[toptab.textid].textid;
					}
					for (var i = 0; i < that.tabs.length; i++) {
						var item = that.tabs[i];
						if (!item) continue;
						if (item.textid === crnttxtid) {
							var tabelem = document.getElementById("tabtitleNo" + item.tabid);
							if (tabelem) tabelem.classList.remove("changetagclass");
							var listelem = document.getElementById("open-file-item-" + item.tabid);
							if (listelem) listelem.classList.remove("open-file-item-change");
						}
					};
				}, 0)
			},
			saveText: function (nlinecode, saveasflg, callbak, seltabno) {
				var that = this;
				var splitflg = false;
				if (seltabno || seltabno === 0) {
					var toptab = this.tabs[seltabno];
				} else {
					if (!this.selecttabid && this.selecttabid - 0 !== 0) return;
					var toptab = this.tabs[this.selecttabid];
				}
				if ((!toptab && toptab - 0 !== 0) || !toptab.session) return;

				if (toptab.splittxt) {
					if (toptab.splitv) {
						var split = toptab.splitv;
					} else {
						var split = toptab.splith;
					}
					var spliteditor = toptab.spliteditor;
					if (split.getCurrentEditor().container === spliteditor.container) {
						splitflg = true;
						var text = spliteditor.getSession().getDocument();
					} else {
						var text = toptab.session.getDocument();
					}
				} else if (toptab.splittxtobj) {
					if (toptab.splitv) {
						var split = toptab.splitv;
					} else {
						var split = toptab.splith;
					}
					var spliteditor = toptab.spliteditor;
					if (split.getCurrentEditor().container === spliteditor.container) {
						splitflg = true;
						var text = toptab.splittxtobj.session.getDocument();
					} else {
						var text = toptab.session.getDocument();
					}
				} else {
					var text = toptab.session.getDocument();
				}
				if (nlinecode) {
					if (nlinecode === "win") {
						text = text.$lines.join("\r\n")
					} else {
						text = text.$lines.join("\n")
					}
					_save(text, splitflg)
				} else {
					chrome.runtime.getPlatformInfo(function (infoobj) {
						if (infoobj.os === "win") {
							text = text.$lines.join("\r\n")
						} else {
							text = text.$lines.join("\n")
						}
						_save(text, splitflg)
					});
				}
				function _save(text, splitflg) {
					var blob = new Blob([text], { 'type': 'text/plain' });
					if (saveasflg) {
						that.saveasCommand(blob, toptab, text, callbak, splitflg);
					} else {
						that.saveCommand(blob, toptab, text, callbak, splitflg);
					}
				}
			},
			saveCommand: function (blob, toptab, text, callbak, splitflg) {
				var that = this;
				var writefile = function (fentry) {
					var regex = new RegExp("^chrome\-extension_" + that.appsid + ".*\:Syncable$");
					if (regex.test(fentry.filesystem.name)) {
						fentry.createWriter(function (fileWriter) {
							fileWriter.onwriteend = function (e) {
								setTimeout(function () {
									if (splitflg) {
										that.clearChangeTabState(toptab, fentry, text, splitflg);
									} else {
										that.clearChangeTabState(toptab, fentry, text);
									}
								}, 10);
								fileWriter.onwriteend = function () {
									if (callbak) callbak();
								};
								fileWriter.truncate(blob.size);
							};
							fileWriter.write(blob);
						});
					} else {
						chrome.fileSystem.isWritableEntry(fentry, function (writeflg) {
							if (writeflg) {
								chrome.fileSystem.getWritableEntry(fentry, function (writableFileEntry) {
									writableFileEntry.createWriter(function (fileWriter) {
										fileWriter.onwriteend = function (e) {
											setTimeout(function () {
												if (splitflg) {
													that.clearChangeTabState(toptab, fentry, text, splitflg);
												} else {
													that.clearChangeTabState(toptab, fentry, text);
												}
											}, 10);
											fileWriter.onwriteend = function () {
												if (callbak) callbak();
											};
											fileWriter.truncate(blob.size);
										};
										fileWriter.write(blob);
									});
								});
							} else {
								that.saveasCommand(blob, toptab, text, callbak);
							}
						});
					}
				};

				if (splitflg) {
					if (toptab.splittxt) {
						that.saveasCommand(blob, null, text, callbak);
					} else if (toptab.splittxtobj) {
						splitflg = toptab.splittxtobj;
						var fentry = toptab.splittxtobj.fentry;
						writefile(fentry);
					}
				} else {
					var txtobj = that.textobjs[toptab.textid];
					if (txtobj && txtobj.fentry) {
						var fentry = txtobj.fentry;
						if (fentry.theme) {
							setTimeout(function () {
								that.clearChangeTabState(toptab, fentry, text);
							}, 10);
							that.setCustomTheme(fentry.fullPath, text, blob);
						} else if (fentry.defkeys) {
							setTimeout(function () {
								that.clearChangeTabState(toptab, fentry, text);
							}, 10);
							that.saveDefaultKeys(fentry.fullPath, text, blob);
						} else if (fentry.keys) {
							setTimeout(function () {
								that.clearChangeTabState(toptab, fentry, text);
							}, 10);
							that.saveExtCustomKeys(null, blob);
						} else if (fentry.rules) {
							setTimeout(function () {
								that.clearChangeTabState(toptab, fentry, text);
							}, 10);
							that.saveHighlightRules(null, blob, fentry.moderules, text);
						} else if (fentry.ucom) {
							setTimeout(function () {
								that.clearChangeTabState(toptab, fentry, text);
							}, 10);
							that.saveUserCommand(text);
						} else if (fentry.userinit) {
							setTimeout(function () {
								that.clearChangeTabState(toptab, fentry, text);
							}, 10);
							that.saveUserInitScript(blob);
						} else if (fentry.editorscript) {
							setTimeout(function () {
								that.clearChangeTabState(toptab, fentry, text);
							}, 10);
							that.saveEditorScript(blob);
						} else if (fentry.fnext) {
							setTimeout(function () {
								that.clearChangeTabState(toptab, fentry, text);
							}, 10);
							that.saveUserFileNameExtension(blob);
						} else if (fentry.fullPath.indexOf(that.gitdir) > -1) {
							setTimeout(function () {
								that.clearChangeTabState(toptab, fentry, text);
							}, 10);
							that.gitSaveItem(blob, fentry, callbak)
						} else {
							writefile(fentry);
						}
					} else {
						that.saveasCommand(blob, toptab, text, callbak);
					}
				}
			},
			saveasCommand: function (blob, toptab, text, callbak) {
				var that = this;
				var ttl = "NewFile";
				if (toptab && toptab.title) ttl = toptab.title;
				chrome.fileSystem.chooseEntry({ 'type': 'saveFile', 'suggestedName': ttl }, function (fileEntry) {
					if (!fileEntry) return;
					fileEntry.createWriter(function (fileWriter) {
						fileWriter.onwriteend = function (e) {
							if (toptab) {
								chrome.fileSystem.getDisplayPath(fileEntry, function (displayPath) {
									var filetype = that.checkFileType(displayPath);
									that.textid++;
									var txtid = that.textid;
									that.textentrys[displayPath] = { textid: txtid };
									var textobj = {
										text: text,
										fullPath: displayPath,
										textid: txtid,
										change: false,
										fentry: fileEntry
									};
									that.textobjs[txtid] = textobj;
									var ftitle = textobj.fentry.name;
									toptab.textid = txtid
									toptab.title = ftitle
									var editor = toptab.editor;
									if (toptab.changefunc) {
										toptab.editor.getSession().removeListener('change', toptab.changefunc);
										toptab.changefunc = null;
									}
									var nses = new ace.createEditSession(text);
									nses.setMode("ace/mode/" + filetype);
									toptab.session = nses;
									textobj.session = nses;
									editor.setSession(nses);
									that.changeEditorTxt(editor, toptab, toptab.textid);
									if (toptab.tabelem) {
										var ttlelem = toptab.tabelem.querySelector(".tabstringclass");
										ttlelem.textContent = ftitle;
									}
									clearTimeout(that.chklisttimerid)
									that.chklisttimerid = setTimeout(function () {
										that.checkFileList();
									}, 300)
									setTimeout(function () {
										that.checkCurrentFile();
									}, 10)
									var splitv = toptab.splitv;
									var splith = toptab.splith;
									if (splitv || splith) {
										that.setSplitScreen(0, true, null, toptab)
									}
									that.clearChangeTabState(toptab, fileEntry, text);
									fileWriter.onwriteend = function () {
										if (callbak) callbak();
									};
									fileWriter.truncate(blob.size);
								});
							} else {
								fileWriter.onwriteend = function () {
								};
								fileWriter.truncate(blob.size);
							}
						};
						fileWriter.write(blob);
					});
				});
			},
			showOptions: function () {
				var elem = document.getElementById("optionsdiv");
				if (elem.style.visibility === "visible") {
					this.hideOptions();
					return;
				}
				elem.style.zIndex = 2147483646;
				elem.style.visibility = "visible";
				elem.style.opacity = 1;

				var crnteditor = this.tabs[this.selecttabid].editor;
				if (!crnteditor) return;
				var session = crnteditor.getSession();
				var mode = session.getMode().$id;
				var modes = mode.split("/");
				document.getElementById("mode").value = modes[modes.length - 1]
			},
			hideOptions: function () {
				var elem = document.getElementById("optionsdiv");
				elem.style.zIndex = 99;
				elem.style.visibility = "hidden";
				elem.style.opacity = 0;
				this.saveOptions();
			},
			loadOptions: function (callback) {
				var that = this;
				chrome.storage.local.get('opts', function (result) {
					if (result["opts"]) {
						var optobj = result["opts"];
						checkSelectElement(document.getElementById("mode"), optobj.mode);
						checkSelectElement(document.getElementById("theme"), optobj.theme);
						checkSelectElement(document.getElementById("fontsize"), optobj.fontsize);
						checkSelectElement(document.getElementById("tabsize"), optobj.tabsize);
						if (optobj.lineheight && optobj.lineheight !== "inherit") {
							checkSelectElement(document.getElementById("editor-line-height"), optobj.lineheight);
							that.setLineHeight(optobj.lineheight)
						} else {
							that.removeLineHeight();
						}
						if (optobj.fontsizepcnt && optobj.fontsizepcnt - 0 !== 100) document.getElementById("fontsize-parcent").value = optobj.fontsizepcnt;
						document.getElementById("fontfamily").value = optobj.fontfamily;
						if (optobj.folding == "false") {
							document.getElementById("folding").selectedIndex = 0;
						}
						if (optobj.keybinding == "ace") {
							document.getElementById("keybinding").selectedIndex = 0;
						} else if (optobj.keybinding == "vim") {
							document.getElementById("keybinding").selectedIndex = 1;
						} else {
							document.getElementById("keybinding").selectedIndex = 2;
						}
						switch (optobj.soft_wrap) {
							case "off":
								break;
							case "free":
								document.getElementById("soft_wrap").selectedIndex = 4;
								break;
							default:
								checkSelectElement(document.getElementById("soft_wrap"), optobj.soft_wrap);
						}
						document.getElementById("select_style").checked = optobj.select_style;
						document.getElementById("search_backwards").checked = optobj.search_backwards;
						document.getElementById("select_style").checked = optobj.select_style;
						document.getElementById("highlight_active").checked = optobj.highlight_active;
						document.getElementById("show_hidden").checked = optobj.show_hidden;
						document.getElementById("display_indent_guides").checked = optobj.display_indent_guides;
						document.getElementById("show_hscroll").checked = optobj.show_hscroll;
						document.getElementById("animate_scroll").checked = optobj.animate_scroll;
						document.getElementById("show_gutter").checked = optobj.show_gutter;
						document.getElementById("show_print_margin").checked = optobj.show_print_margin;
						document.getElementById("soft_tab").checked = optobj.soft_tab;
						document.getElementById("highlight_selected_word").checked = optobj.highlight_selected_word;
						document.getElementById("enable_behaviours").checked = optobj.enable_behaviours;
						document.getElementById("fade_fold_widgets").checked = optobj.fade_fold_widgets;
						document.getElementById("elastic_tabstops").checked = optobj.elastic_tabstops;
						document.getElementById("isearch").checked = optobj.isearch;
						document.getElementById("read_only").checked = optobj.read_only;
						document.getElementById("js_valid").checked = optobj.js_valid;
						document.getElementById("hide_hscrollbar").checked = optobj.hide_hscrollbar;
						document.getElementById("live_auto").checked = optobj.live_auto;
						document.getElementById("auto_save").checked = optobj.auto_save;
						document.getElementById("show_bar").checked = optobj.show_bar;
						document.getElementById("remember_open_files").checked = optobj.remember_open_files;
						document.getElementById("sever-port-input").value = optobj.server_port;
						document.getElementById("char-set-select").selectedIndex = optobj.charset_select;
						document.getElementById("highlight_search_active").checked = optobj.highlight_search_active;
						document.getElementById("diff_style").value = optobj.diff_style;
						document.getElementById("show_tabs").checked = optobj.show_tabs;

						if (optobj.hide_hscrollbar) {
							that.addHideHscrollbar();
						} else {
							that.addHideHscrollbar(true);
						}
						if (optobj.webview_preview) document.getElementById("main-webview-container").style.left = optobj.webview_preview + "px";
						document.getElementById("no_italic").checked = optobj.no_italic;
						if (optobj.no_italic) {
							that.noItalic();
						} else {
							that.removenoItalic();
						}
						that.optobj = optobj;
						if (!optobj.show_tabs) that.hideTabs();
					}
					if (callback) callback();
					var editor = ace.edit("editor");
					that.loadSettings(editor);
				});
				function checkSelectElement(selelem, str) {
					var len = selelem.options.length;
					for (var i = 0; i < len; i++) {
						if (str == selelem[i].value) {
							selelem.selectedIndex = i;
							break;
						}
					}
				}
			},
			saveOptions: function (modeflg) {
				var that = this;
				var optobj = this.optobj;
				optobj.mode = document.getElementById("mode")[document.getElementById("mode").selectedIndex].value;
				optobj.theme = document.getElementById("theme")[document.getElementById("theme").selectedIndex].value;
				optobj.tabsize = document.getElementById("tabsize")[document.getElementById("tabsize").selectedIndex].value;
				optobj.fontsize = document.getElementById("fontsize")[document.getElementById("fontsize").selectedIndex].value;
				optobj.fontsizepcnt = document.getElementById("fontsize-parcent").value;
				optobj.fontfamily = document.getElementById("fontfamily").value;
				optobj.lineheight = document.getElementById("editor-line-height")[document.getElementById("editor-line-height").selectedIndex].value;
				if (optobj.lineheight && optobj.lineheight !== "inherit") {
					that.setLineHeight(optobj.lineheight)
				} else {
					that.removeLineHeight();
				}
				optobj.folding = document.getElementById("folding")[document.getElementById("folding").selectedIndex].value;
				optobj.keybinding = document.getElementById("keybinding")[document.getElementById("keybinding").selectedIndex].value;
				optobj.soft_wrap = document.getElementById("soft_wrap")[document.getElementById("soft_wrap").selectedIndex].value;
				optobj.search_backwards = document.getElementById("search_backwards").checked;
				optobj.select_style = document.getElementById("select_style").checked;
				optobj.highlight_active = document.getElementById("highlight_active").checked;
				optobj.show_hidden = document.getElementById("show_hidden").checked;
				optobj.display_indent_guides = document.getElementById("display_indent_guides").checked;
				optobj.show_hscroll = document.getElementById("show_hscroll").checked;
				optobj.animate_scroll = document.getElementById("animate_scroll").checked;
				optobj.show_gutter = document.getElementById("show_gutter").checked;
				optobj.show_print_margin = document.getElementById("show_print_margin").checked;
				optobj.soft_tab = document.getElementById("soft_tab").checked;
				optobj.highlight_selected_word = document.getElementById("highlight_selected_word").checked;
				optobj.enable_behaviours = document.getElementById("enable_behaviours").checked;
				optobj.fade_fold_widgets = document.getElementById("fade_fold_widgets").checked;
				optobj.elastic_tabstops = document.getElementById("elastic_tabstops").checked;
				optobj.isearch = document.getElementById("isearch").checked;
				optobj.read_only = document.getElementById("read_only").checked;
				optobj.js_valid = document.getElementById("js_valid").checked;
				optobj.hide_hscrollbar = document.getElementById("hide_hscrollbar").checked;
				optobj.live_auto = document.getElementById("live_auto").checked;
				optobj.auto_save = document.getElementById("auto_save").checked;
				optobj.show_bar = document.getElementById("show_bar").checked;
				optobj.remember_open_files = document.getElementById("remember_open_files").checked;
				optobj.server_port = document.getElementById("sever-port-input").value - 0;
				optobj.charset_select = document.getElementById("char-set-select").selectedIndex;
				optobj.highlight_search_active = document.getElementById("highlight_search_active").checked;
				optobj.show_sidebar = that.optobj.show_sidebar;
				optobj.diff_style = document.getElementById("diff_style").value;
				optobj.show_tabs = document.getElementById("show_tabs").checked;
				if (optobj.show_tabs) {
					that.showTabs()
				} else {
					that.hideTabs()
				}
				if (optobj.hide_hscrollbar) {
					that.addHideHscrollbar();
				} else {
					that.addHideHscrollbar(true);
				}
				optobj.no_italic = document.getElementById("no_italic").checked;
				if (optobj.no_italic) {
					that.noItalic();
				} else {
					that.removenoItalic();
				}
				that.optobj = optobj;
				chrome.storage.local.set({ 'opts': optobj });

				if (modeflg) {
					var crnteditor = that.tabs[that.selecttabid].editor;
					crnteditor.getSession().setMode("ace/mode/" + optobj.mode);
				}
				for (var i = 0; i < that.tabs.length; i++) {
					(function (items, i) {
						var item = items[i];
						if (item) {
							var edit = item.editor;
							if (edit) that.loadSettings(edit);
						}
					})(that.tabs, i);
				};
			},
			reloadFolder: function (idx, contul) {
				var that = this;
				var entry = this.currentfolderentrys[idx - 0];
				var pobj = {};
				pobj.children = [];
				pobj.fentry = entry;
				pobj.name = entry.name;
				that.projectitems[idx - 0] = {};
				that.projectitems[idx - 0][entry.fullPath] = entry;
				$(contul).empty();
				var cb = function (root) {
					that.createProject(root, null, idx, null, contul)
				};
				this.onInitFs(entry, [], null, pobj, pobj, cb, idx);
			},
			showContextMenu: function (e) {
				if (e.srcElement.tagName) {
					var elem = e.srcElement;
					if (elem.tagName.toUpperCase() === "SPAN") {
						elem = elem.parentNode;
					}
					if (elem.classList.contains("subfolder-item")) {
						elem = elem.parentNode;
					}
					if (elem.classList.contains("project-file")) {
						var idx = elem.getAttribute("data-pidx");
						var paths = elem.getAttribute("data-path").split("/");
						paths.pop();
						path = paths.join("/");
						var item = this.projectitems[idx - 0];
						if (item[path]) {
							var tobj = {
								dentry: item[path],
								ulelem: elem.parentNode,
								pid: idx
							};
							this.contextmenutarget = tobj;
							this.showMainContextMenu(e, elem)
							e.preventDefault();
							e.stopPropagation();
						}
					} else if (elem.classList.contains("project-folder")) {
						var idx = elem.getAttribute("data-pidx");
						var path = elem.getAttribute("data-path");
						var item = this.projectitems[idx - 0];
						if (item[path]) {
							var tobj = {
								dentry: item[path],
								ulelem: elem.querySelector("ul"),
								pid: idx
							};
							this.contextmenutarget = tobj;
							this.showMainContextMenu(e, elem)
							e.preventDefault();
							e.stopPropagation();
						}
					}
				}
			},
			hideContextMenu: function () {
				document.getElementById("context-menu").style.display = "none";
			},
			showMainContextMenu: function (e, srcelem) {
				var contxtm = document.getElementById("context-menu");
				contxtm.style.top = e.clientY - contxtm.offsetHeight + "px";
				contxtm.style.left = e.clientX + "px";
				contxtm.style.display = "block";
			},
			createProjecFile: function (name) {
				var that = this;
				var tobj = simpleEditor.contextmenutarget;
				if (tobj.type === "file") {
					if (!name) name = "NewFile";
					var rootentry = tobj.dentry;
					var blob = new Blob([""], { 'type': 'text/plain' });
					rootentry.getFile(name, { create: true, exclusive: true }, function (fileEntry) {
						fileEntry.createWriter(function (fileWriter) {
							fileWriter.onwriteend = function (e) {
								fileWriter.onwriteend = function () {
									that.projectitems[tobj.pid - 0][fileEntry.fullPath] = fileEntry;
									simpleEditor.contextmenutarget = null;
									that.createProjectItem([fileEntry], tobj.ulelem, false, tobj.pid, null, true)
								};
								fileWriter.truncate(blob.size);
							};
							fileWriter.write(blob);
						});
					});
				} else if (tobj.type === "folder") {
					if (!name) name = "NewFolder";
					var rootentry = tobj.dentry;
					rootentry.getDirectory(name, { create: true, exclusive: true }, function (dirEntry) {
						that.projectitems[tobj.pid - 0][dirEntry.fullPath] = dirEntry;
						simpleEditor.contextmenutarget = null;
						dirEntry.children = [];
						that.createProjectItem([dirEntry], tobj.ulelem, false, tobj.pid)
					});
				}
			},
			startServer: function (idx) {
				var entry = this.currentfolderentrys[idx - 0];
				if (!entry) return;
				var port = this.optobj.server_port;
				chrome.runtime.getBackgroundPage(function (bg) {
					window.entry = entry
					bg.entry = entry
					bg.haveentry(entry)
					bg.statServer(false, "http://127.0.0.1:" + port, port);
				});
			},
			stopServer: function () {
				chrome.runtime.getBackgroundPage(function (bg) {
					bg.stopServer();
				});
			},
			searchFile: function (val) {
				var that = this;
				var val = val.replace(/^\s+|\s+$/g, "");
				if (!val) {
					document.getElementById("search-file-container").style.display = "none";
					document.getElementById("search-finish-button").style.display = "none";
				} else {
					var mcont = document.getElementById("search-file-container");
					var cont = document.getElementById("search-file-item-container");
					var sfbtn = document.getElementById("search-finish-button");
					$(cont).empty();
					mcont.style.display = "block";
					sfbtn.style.display = "block";
					var ofiles = document.querySelectorAll(".open-file-item");
					var pfiles = document.querySelectorAll(".project-file");

					var li = document.createElement("li");
					cont.appendChild(li);
					li.setAttribute("class", "open-file-item-header");
					var div = document.createElement("div");
					li.appendChild(div);
					var spanelm = document.createElement("label");
					div.appendChild(spanelm);
					spanelm.appendChild(document.createTextNode("Open Files"));

					for (var i = 0; i < ofiles.length; i++) {
						var item = ofiles[i]
						var tid = item.getAttribute("data-tabid");
						var txt = item.textContent;
						var rstr = "^.*" + val + ".*$";
						var regex = new RegExp(rstr, "i");
						if (regex.test(txt)) this.createSearchItems(txt, cont, tid, true)
					}

					var li = document.createElement("li");
					cont.appendChild(li);
					li.setAttribute("class", "Project-file-item-header");
					var div = document.createElement("div");
					li.appendChild(div);
					var spanelm = document.createElement("label");
					div.appendChild(spanelm);
					spanelm.appendChild(document.createTextNode("Project Files"));

					for (var i = 0; i < pfiles.length; i++) {
						var item = pfiles[i]
						var path = item.getAttribute("data-path");
						var fpath = item.getAttribute("data-fpath");
						var pidx = item.getAttribute("data-pidx");
						var txt = item.textContent;
						var rstr = "^.*" + val + ".*$";
						var regex = new RegExp(rstr, "i");
						if (regex.test(txt)) that.createSearchItems(txt, cont, pidx - 0, false, path, fpath)
					}
				}
			},
			createSearchItems: function (str, prntnd, id, openflg, path, fpath) {
				var that = this;
				var li = document.createElement("li");
				prntnd.appendChild(li);
				li.setAttribute("class", "open-file-item");
				li.setAttribute("data-path", path);
				li.setAttribute("data-fpath", fpath);

				var div = document.createElement("div");
				li.appendChild(div);
				li.addEventListener("click", function (e) {
					if (openflg) {
						that.selectTab(id)
					} else {
						that.clickProjectItem(this, id - 0)
					}
				}, false);
				var div = document.createElement("div");
				li.appendChild(div);

				var spanelm = document.createElement("label");
				div.appendChild(spanelm);
				spanelm.appendChild(document.createTextNode(str));

				if (openflg) {
					var tab = this.tabs[id - 0]
					if (tab && this.textobjs && this.textobjs[tab.textid] && this.textobjs[tab.textid].fullPath) {
						li.setAttribute("title", this.textobjs[tab.textid].fullPath);
					}
				} else {
					var item = that.projectitems[id - 0][path];
					if (item && item.fullPath) {
						li.setAttribute("title", item.fullPath);
					}
				}
			},
			hideTabs: function () {
				this.showTabs();
				var style = document.createElement('style');
				style.setAttribute("type", "text/css");
				style.setAttribute("id", "hide_tab_css")
				style.textContent = ".editor{top:0 !important}#topmenucontainer{display:none !important}"
				document.getElementsByTagName('head')[0].appendChild(style);
			},
			showTabs: function () {
				var css = document.getElementById("hide_tab_css");
				if (css) $(css).remove();
			},
			startFind: function () {
				var that = this;
				chrome.fileSystem.chooseEntry({
					type: "openDirectory"
				}, function (fileEntrie) {
					if (fileEntrie) {
						that.replaceallitems = [];
						document.getElementById('find-replaceall-container').style.display = "none";
						document.getElementById("loadingModal").style.display = "block"
						var pobj = {};
						var list = [];
						pobj.children = [];
						pobj.fentry = fileEntrie;
						pobj.name = fileEntrie.name;
						var cb = function (root) {
							var nlist = [];
							for (var i = 0; i < list.length; i++) {
								var item = list[i];
								if (that.checkFileType(item.name, true)) {
									nlist.push(item)
								}
							};
							var keywdobj = {};
							keywdobj.keywd = document.getElementById("find-input").value;
							keywdobj.regExp = document.getElementById("find-regexp-checkbox").checked;
							keywdobj.caseSensitive = document.getElementById("find-caseSensitive-checkbox").checked;
							keywdobj.wholeWord = document.getElementById("find-wholeWord-checkbox").checked;

							var callback = function (obj) {
								that.createFindItems(obj);
							};
							var cont = document.getElementById("open-find-list");
							$(cont).empty();
							document.getElementById("find-count-info").textContent = 0;
							that.execFind(nlist, keywdobj, callback, [])
						};
						that.onInitFs(fileEntrie, list, null, pobj, pobj, cb, 0, "find");
					}
				});
			},
			createFindItems: function (fobj) {
				var that = this;
				document.getElementById("loadingModal").style.display = "none"
				document.getElementById("findModal").style.display = "block";
				var itemcnt = fobj.cnt;
				var cont = document.getElementById("open-find-list");
				$(cont).empty();
				document.getElementById("find-count-info").textContent = itemcnt;
				if (fobj.ary.length > 0) document.getElementById('find-replaceall-container').style.display = "block";
				that.replaceallitems = fobj;

				for (var i = 0; i < fobj.ary.length; i++) {
					var item = fobj.ary[i];
					var h3 = document.createElement("h3");
					cont.appendChild(h3)
					h3.textContent = item.displayPath

					for (var ii = 0; ii < item.matchs.length; ii++) {
						var citem = item.matchs[ii];

						var div = document.createElement("div");
						cont.appendChild(div)
						div.setAttribute("class", "find-item");
						div.setAttribute("data-i", i);
						div.setAttribute("data-ii", ii);
						div.addEventListener("click", function () {
							var i = this.getAttribute("data-i");
							var ii = this.getAttribute("data-ii");
							that.clickFindItem(fobj, i, ii)
						}, false)

						var no = document.createElement("span")
						div.appendChild(no)
						no.setAttribute("class", "find-item-number")
						no.textContent = citem.pos;

						var lbl = document.createElement("span")
						div.appendChild(lbl)
						lbl.setAttribute("class", "find-item-label")
						lbl.textContent = citem.line;
					};
				};
			},
			clickFindItem: function (fobj, i, ii) {
				var elem = document.getElementById('findModal');
				elem.style.opacity = 0;
				setTimeout(function () {
					elem.style.display = "none";
				}, 200);
				var that = this;
				var item = fobj.ary[i];
				var citem = item.matchs[ii];
				var callback = function (editor) {
					setTimeout(function () {
						editor.gotoLine(citem.pos - 0, citem.column, false)
						var elem = document.getElementById("findModal");
						elem.style.display = "block";
						setTimeout(function () {
							elem.style.opacity = 1;
						}, 600);
					}, 250)
				};
				item.fentry.file(function (file) {
					var reader = new FileReader();
					reader.onloadend = function (e) {
						that.createTab(this.result, item.fentry, null, null, null, callback);
					};
					reader.readAsText(file);
				});
			},
			clickFindReplaceAllItem: function (val) {
				var elem = document.getElementById('findModal');
				elem.style.opacity = 0;
				setTimeout(function () {
					elem.style.display = "none";
				}, 200);
				var that = this;
				var fobj = this.replaceallitems;
				var fobjary = fobj.ary;
				var idx = -1;
				var func = function () {
					idx++;
					if (fobjary[idx]) {
						var callback = function (editor) {
							setTimeout(function () {
								editor.find(fobj.sopt.keywd, {
									skipCurrent: false,
									backwards: true,
									wrap: true,
									regExp: fobj.sopt.regExp,
									caseSensitive: fobj.sopt.caseSensitive,
									wholeWord: fobj.sopt.wholeWord
								});
								var range = editor.findAll(fobj.sopt.keywd, {
									regExp: fobj.sopt.regExp,
									caseSensitive: fobj.sopt.caseSensitive,
									wholeWord: fobj.sopt.wholeWord,
								});
								editor.replaceAll(val);
								setTimeout(function () {
									func();
								}, 100)
							}, 250)
						};
						var item = fobjary[idx];
						item.fentry.file(function (file) {
							var reader = new FileReader();
							reader.onloadend = function (e) {
								that.createTab(this.result, item.fentry, null, null, null, callback);
							};
							reader.readAsText(file);
						});
					}
				};
				func();
			},
			execFind: function (nlist, keywdobj, callback, checkline) {
				var that = this;
				if (!this.findeditor) {
					var pre = document.createElement("div");
					document.body.appendChild(pre);
					pre.setAttribute("class", "editor");
					pre.setAttribute("id", "findeditor");
					pre.style.zIndex = 0;
					pre.style.visibility = "hidden";
					var editor = ace.edit("findeditor");
					editor.$blockScrolling = Infinity;
					this.loadSettings(editor);
					this.findeditor = editor;
				}
				var findobj = {}
				findobj.ary = [];
				findobj.cnt = 0;
				var read = function (fileEntrys, idx, editor, findobj, keywdobj, checkline) {
					chrome.fileSystem.getDisplayPath(fileEntrys[idx], function (displayPath) {
						fileEntrys[idx].file(function (file) {
							var reader = new FileReader();
							reader.onloadend = function (e) {
								var txt = this.result;
								editor.setValue(txt, -1);
								CONFIG.loadModule("ace/ext/searchbox", function (e) {
									e.Search(editor)
									var keywd = keywdobj.keywd;
									var regExp = keywdobj.regExp;
									var caseSensitive = keywdobj.caseSensitive;
									var wholeWord = keywdobj.wholeWord;
									editor.find(keywd, {
										skipCurrent: false,
										backwards: true,
										wrap: true,
										regExp: regExp,
										caseSensitive: caseSensitive,
										wholeWord: wholeWord
									});
									var range = editor.findAll(keywd, {
										regExp: regExp,
										caseSensitive: caseSensitive,
										wholeWord: wholeWord,
										countflg: editor.session
									});
									if (range.length > 0) {
										var obj = {};
										obj.fentry = fileEntrys[idx];
										obj.displayPath = displayPath
										obj.matchs = [];
										checkline = [];
										for (var i = 0; i < range.length; i++) {
											var item = range[i];
											var statpos = item.start.row + 1;
											findobj.cnt++;
											if (checkline.indexOf(statpos) !== -1) {
												continue;
											}
											checkline.push(statpos)
											var mobj = {};
											var line = editor.session.getLine(item.start.row)
											mobj.pos = statpos;
											mobj.column = item.start.column;
											mobj.line = line;
											obj.matchs.push(mobj)
										};
										findobj.ary.push(obj)
										findobj.sopt = keywdobj;
									}
									idx++;
									if (fileEntrys[idx]) {
										read(fileEntrys, idx, editor, findobj, keywdobj, checkline);
									} else {
										if (callback) callback(findobj);
									}
								});
							};
							reader.readAsText(file);
						})
					})
				};
				if (nlist.length < 1) {
					document.getElementById("loadingModal").style.display = "none";
					return;
				}
				read(nlist, 0, this.findeditor, findobj, keywdobj, checkline);
			},
			openEditMarkdown: function () {
				var that = this, tmptext = "";
				chrome.storage.local.get("___markdown__tmp__", function (obj) {
					var tmp = obj["___markdown__tmp__"];
					if (tmp) tmptext = tmp;
					var elem = document.getElementById("markdownModal");
					elem.style.display = "block";
					setTimeout(function () {
						elem.style.opacity = 1;
					}, 20);
					if (!that.markdowneditor) {
						that.markdowneditor = ace.edit("markdown-editor");
						var editor = that.markdowneditor;
						editor.renderer.setScrollMargin(8, that.windowheight, 3, 3)
						that.loadSettings(editor);
						setTimeout(function () {
							that.loadExtCustomKeys(editor, null, null, true);
						}, 250)
						var session = editor.getSession();
						editor.setValue(tmptext, -1)
						session.setUndoManager(new UndoManager());
						session.setMode("ace/mode/markdown");
						marked.setOptions({
							renderer: new marked.Renderer(),
							gfm: true,
							tables: true,
							breaks: false,
							pedantic: false,
							sanitize: true,
							smartLists: true,
							smartypants: false
						});
						editor.on('input', function () {
							clearTimeout(that.markdowntimerid)
							that.markdowntimerid = setTimeout(function () {
								var src = editor.getValue();
								var html = marked(src);
								$('#markdown-previewer').html(html);
								var sobj = {};
								sobj["___markdown__tmp__"] = src
								chrome.storage.local.set(sobj)
							}, 1500);
						});
					}
				})
			},
			showGoto: function (type) {
				this.currentpanelmode = null;
				this.gotosession = null;
				this.showgoto = true;
				$("#gotoModal-item-container").empty();
				var elem = document.getElementById('gotoModal');
				elem.style.display = "block";
				setTimeout(function () {
					elem.style.opacity = 1;
					var inpt = document.getElementById('goto-input');
					inpt.value = "";
					inpt.focus();
				}, 20);
				var crnteditor = this.tabs[this.selecttabid].editor;
				crnteditor.blur();
				var cval = crnteditor.getValue();
				var csession = crnteditor.getSession();
				var emode = csession.getMode().$id;
				var editor = ace.edit("editor");
				var session = editor.getSession();
				session.setMode(emode)
				editor.setValue(cval, -1);
				editor.gotoLine(0, 0, false)
				editor.setReadOnly(true);
				this.removeGotoLien();
			},
			hideGoto: function () {
				var that = this;
				document.getElementById('editor').style.zIndex = 1;
				var elem = document.getElementById('gotoModal');
				elem.style.opacity = 1;
				setTimeout(function () {
					elem.style.display = "none";
					var crnteditor = that.tabs[that.selecttabid].editor;
					crnteditor.focus();
					setTimeout(function () {
						crnteditor.focus();
					}, 30);
				}, 20);
				this.showgoto = false;
				this.gotosession = null;
				this.removeGotoLien();
			},
			removeGotoLien: function () {
				var robj = this.gotorange;
				if (robj && robj.hl) {
					var editor = ace.edit("editor");
					editor.session.removeMarker(robj.hl.id);
					robj.hl = null;
				}
				this.gotosession = null;
			},
			changeGoto: function (val, keycode, shift) {
				this.removeGotoLien();
				if (/^\:[ 0-9]+/.test(val)) {
					this.currentpanelmode = "gotoline"
					if (keycode === "tab") return;
					$("#gotoModal-item-container").empty();
					this.jumpGotoPreview(val, keycode, shift)
				} else if (/^\#.+/.test(val)) {
					this.currentpanelmode = "searchline"
					$("#gotoModal-item-container").empty();
					this.searchGotoPreview(val, keycode, shift)
				} else if (/^\/.+/.test(val)) {
					this.currentpanelmode = "command"
					if (keycode === "tab") return;
					$("#gotoModal-item-container").empty();
					document.getElementById('editor').style.zIndex = 1;
					var editor = ace.edit("editor");
					var lines = val.split("/");
					var line = lines[1];
					if (line) this.createCommandPalette(line);
				} else if (val) {
					this.currentpanelmode = "file"
					$("#gotoModal-item-container").empty();
					document.getElementById('editor').style.zIndex = 1;
					this.createGotoItem(val, keycode, shift)
				} else {
					this.currentpanelmode = "file"
					$("#gotoModal-item-container").empty();
					document.getElementById('editor').style.zIndex = 1;
					this.gotoelem = null;
				}
			},
			createCommandPalette: function (val) {
				var cont = document.getElementById("gotoModal-item-container");
				$(cont).empty();
				var that = this;
				var callback = function (commands) {
					var itemcnt = 0;
					if (!commands) commands = [];
					var mcommans = [
						{
							name: "edit command",
							exec: function () {
								that.loadUserCommand(true)
							}
						}, {
							name: "goto",
							exec: function () {
								that.showGoto()
							}
						}, {
							name: "diff",
							exec: function () {
								that.openAceDiff();
							}
						}, {
							name: "markdown",
							exec: function () {
								that.openEditMarkdown()
							}
						}, {
							name: "close tab",
							exec: function () {
								var tabid = that.selecttabid;
								that.removeTab(tabid);
							}
						}, {
							name: "select next tab",
							exec: function () {
								var tabid = that.selecttabid;
								var li = document.getElementById("tabliNo" + tabid);
								if (li) {
									var nextli = li.nextSibling;
									if (nextli) {
										nextli.click();
									} else {
										nextli = li.parentNode.firstChild;
										if (nextli) nextli.click();
									}
								}
							}
						}, {
							name: "select previous tab",
							exec: function () {
								var tabid = that.selecttabid;
								var li = document.getElementById("tabliNo" + tabid);
								if (li) {
									var preli = li.previousSibling;
									if (preli) {
										preli.click();
									} else {
										preli = li.parentNode.lastChild;
										if (preli) preli.click();
									}
								}
							}
						}, {
							name: "toggle sidebar",
							exec: function () {
								that.toggleProjectManager();
							}
						}, {
							name: "close window",
							exec: function () {
								chrome.app.window.current().close();
							}
						}, {
							name: "toggle fullscreen",
							exec: function () {
								that.setFullScreen();
							}
						}, {
							name: "open folder",
							exec: function () {
								document.getElementsByClassName("modal-awesome-folder")[0].click()
							}
						}, {
							name: "open file",
							exec: function () {
								document.getElementsByClassName("modal-awesome-file")[0].click()
							}
						}, {
							name: "open file with encoding",
							exec: function () {
								document.getElementsByClassName("modal-awesome-charset")[0].click()
							}
						}, {
							name: "open zip",
							exec: function () {
								document.getElementsByClassName("modal-awesome-zip")[0].click()
							}
						}, {
							name: "new file",
							exec: function () {
								document.getElementsByClassName("modal-awesome-new")[0].click()
							}
						}, {
							name: "new window",
							exec: function () {
								document.getElementsByClassName("modal-awesome-newwindow")[0].click()
							}
						}, {
							name: "insert file",
							exec: function () {
								document.getElementsByClassName("modal-awesome-insert")[0].click()
							}
						}, {
							name: "create web app",
							exec: function () {
								document.getElementsByClassName("modal-awesome-webapp")[0].click()
							}
						}, {
							name: "create chrome apps",
							exec: function () {
								document.getElementsByClassName("modal-awesome-chromeapp")[0].click()
							}
						}, {
							name: "create chrome extension",
							exec: function () {
								document.getElementsByClassName("modal-awesome-chromeext")[0].click()
							}
						}, {
							name: "github url",
							exec: function () {
								document.getElementsByClassName("modal-awesome-githubdl")[0].click()
							}
						}, {
							name: "save",
							exec: function () {
								document.getElementsByClassName("modal-awesome-save")[0].click()
							}
						}, {
							name: "save as",
							exec: function () {
								document.getElementsByClassName("modal-awesome-saveas")[0].click()
							}
						}, {
							name: "save as crlf line endings",
							exec: function () {
								document.getElementsByClassName("modal-awesome-saveascrlf")[0].click()
							}
						}, {
							name: "save as lf line endings",
							exec: function () {
								document.getElementsByClassName("modal-awesome-saveaslf")[0].click()
							}
						}, {
							name: "save all",
							exec: function () {
								document.getElementsByClassName("modal-awesome-saveall")[0].click()
							}
						}, {
							name: "print",
							exec: function () {
								document.getElementsByClassName("modal-awesome-print")[0].click()
							}
						}, {
							name: "show/hide side bar",
							exec: function () {
								document.getElementsByClassName("modal-awesome-show-project-manager")[0].click()
							}
						}, {
							name: "open project",
							exec: function () {
								document.getElementsByClassName("modal-awesome-createpo")[0].click()
							}
						}, {
							name: "new project",
							exec: function () {
								document.getElementsByClassName("modal-awesome-createpn")[0].click()
							}
						}, {
							name: "edit project",
							exec: function () {
								document.getElementsByClassName("modal-awesome-createpe")[0].click()
							}
						}, {
							name: "save project",
							exec: function () {
								document.getElementsByClassName("modal-awesome-createps")[0].click()
							}
						}, {
							name: "start web server",
							exec: function () {
								document.getElementsByClassName("modal-awesome-server")[0].click()
							}
						}, {
							name: "stop web server",
							exec: function () {
								document.getElementsByClassName("modal-awesome-stopserver")[0].click()
							}
						}, {
							name: "new view",
							exec: function () {
								document.getElementsByClassName("modal-awesome-newview")[0].click()
							}
						}, {
							name: "vertically split",
							exec: function () {
								document.getElementsByClassName("modal-awesome-splitv")[0].click()
							}
						}, {
							name: "horizontally split",
							exec: function () {
								document.getElementsByClassName("modal-awesome-splith")[0].click()
							}
						}, {
							name: "reset split",
							exec: function () {
								document.getElementsByClassName("modal-awesome-resetsplit")[0].click()
							}
						}, {
							name: "settings",
							exec: function () {
								document.getElementsByClassName("modal-awesome-settings")[0].click()
							}
						}, {
							name: "edit theme",
							exec: function () {
								document.getElementsByClassName("modal-awesome-custheme")[0].click()
							}
						}, {
							name: "reset theme",
							exec: function () {
								document.getElementsByClassName("modal-awesome-rmtheme")[0].click()
							}
						}, {
							name: "edit keyboard",
							exec: function () {
								document.getElementsByClassName("modal-awesome-custkey")[0].click()
							}
						}, {
							name: "edit keyboard etc",
							exec: function () {
								document.getElementsByClassName("modal-awesome-excustkey")[0].click()
							}
						}, {
							name: "edit snippets",
							exec: function () {
								document.getElementsByClassName("modal-awesome-snippet")[0].click()
							}
						}, {
							name: "edit user init script",
							exec: function () {
								document.getElementsByClassName("modal-awesome-uinit")[0].click()
							}
						}, {
							name: "edit add script to editor",
							exec: function () {
								document.getElementsByClassName("modal-awesome-addedtior")[0].click()
							}
						}, {
							name: "edit file mode",
							exec: function () {
								document.getElementsByClassName("modal-awesome-ufextensin")[0].click()
							}
						}, {
							name: "git user setting",
							exec: function () {
								document.getElementsByClassName("modal-awesome-gitusersetting")[0].click()
							}
						}, {
							name: "git open",
							exec: function () {
								document.getElementsByClassName("modal-awesome-gitopen")[0].click()
							}
						}, {
							name: "git clone",
							exec: function () {
								document.getElementsByClassName("modal-awesome-gitclone")[0].click()
							}
						}, {
							name: "git commit",
							exec: function () {
								document.getElementsByClassName("modal-awesome-gitcommit")[0].click()
							}
						}, {
							name: "git push",
							exec: function () {
								document.getElementsByClassName("modal-awesome-gitpush")[0].click()
							}
						}, {
							name: "git pull",
							exec: function () {
								document.getElementsByClassName("modal-awesome-gitpull")[0].click()
							}
						}, {
							name: "git branch",
							exec: function () {
								document.getElementsByClassName("modal-awesome-gitbranch")[0].click()
							}
						}, {
							name: "git checkout",
							exec: function () {
								document.getElementsByClassName("modal-awesome-gitcheckout")[0].click()
							}
						}
					];
					mcommans = mcommans.concat(commands)
					var cmp = function (a, b) { return a.name.localeCompare(b.name) };
					mcommans.sort(cmp);
					that.commands = mcommans;

					for (var ii = 0, len = mcommans.length; ii < len; ii++) {
						var item = mcommans[ii]
						var regex = new RegExp(val, "i");
						if (!regex.test(item.name)) continue;

						var div = document.createElement("div");
						cont.appendChild(div);
						div.setAttribute("class", "command-palette-item");
						div.index = ii;
						var ndiv = document.createElement("div")
						div.appendChild(ndiv);
						ndiv.appendChild(document.createTextNode(item.name));
						ndiv.setAttribute("class", "command-palette-item-name");

						div.addEventListener("mouseenter", that.selectCommandPalette, false)
						div.addEventListener("click", function () {
							that.hideGoto();
							mcommans[this.index].exec();
						}, false)
						itemcnt++;
						if (itemcnt > 9) break;
					}
				};
				this.ACE_EDITOR_USER_COMMANDS(ace, this, callback);
			},
			selectCommandPalette: function (e, elem) {
				var elems = document.getElementsByClassName("command-palette-item")
				for (var i = 0; i < elems.length; i++) {
					elems[i].classList.remove("select-command-palette-item")
				};
				if (e) {
					elem = this;
					elem.classList.add("select-command-palette-item");
					var txt = "/" + elem.textContent;
					document.getElementById('goto-input').value = txt;
				} else {
					if (!elem) return;
					elem.classList.add("select-command-palette-item");
					var inpttxt = document.getElementById('goto-input').value;
					var txt = "/" + elem.textContent;
					document.getElementById('goto-input').value = txt;
				}
			},
			createGotoItem: function (val, keycode, shift) {
				var that = this;
				if (!this.projectitems) return;
				if (/[\/]{1}/.test(val)) return;
				if (/[\:]{1}/.test(val)) {
					setTimeout(function () {
						that.jumpGotoPreview(val, keycode, shift)
					}, 0)
					return;
				}
				if (/[\#]{1}/.test(val)) {
					setTimeout(function () {
						that.searchGotoPreview(val, keycode, shift)
					}, 0)
					return;
				}
				if (keycode === "tab") return;
				var itemcnt = 0;
				var cflg = false;
				var cont = document.getElementById("gotoModal-item-container");
				$(cont).empty();

				for (var i = 0; i < this.projectitems.length; i++) {
					var pitem = this.projectitems[i];
					if (!pitem) continue;
					var keys = Object.keys(pitem);
					for (var ii = 1, len = keys.length; ii < len; ii++) {
						var item = pitem[keys[ii]]
						if (!item.children && itemcnt < 10) {
							if (val) {
								var regex = new RegExp(val, "i");
								if (!regex.test(item.name)) continue;
							}
							var div = document.createElement("div");
							cont.appendChild(div);
							div.setAttribute("class", "goto-item");

							var ndiv = document.createElement("div")
							div.appendChild(ndiv);
							ndiv.appendChild(document.createTextNode(item.name));
							ndiv.setAttribute("class", "goto-item-name");

							var pdiv = document.createElement("div")
							div.appendChild(pdiv);
							pdiv.appendChild(document.createTextNode(item.fullPath));
							pdiv.setAttribute("class", "goto-item-path");

							div.addEventListener("mouseenter", function (e) {
								that.selectGotoItem(this)
							}, false);
							div.setAttribute("data-pid", i);
							div.setAttribute("data-iid", keys[ii]);
							div.setAttribute("data-fpath", item.fullPath);
							div.setAttribute("data-spath", item.name);
							div.addEventListener("click", function () {
								that.openGotoItem(this);
							}, false)
							if (this.gotoelem && this.gotoelem.fpath === item.fullPath && this.gotoelem.spath === val) {
								cflg = true;
								this.selectGotoItem(null, div)
							} else if (!cflg && val === item.name) {
								this.selectGotoItem(null, div)
							}
							itemcnt++;
						}
						if (itemcnt > 9) break;
					}
					if (itemcnt > 9) break;
				};
				if (!cflg) this.gotoelem = null;
			},
			selectGotoItem: function (e, elem) {
				var that = this;
				var elems = document.getElementsByClassName("select-goto-item")
				for (var i = 0; i < elems.length; i++) {
					elems[i].classList.remove("select-goto-item")
				};
				if (e) {
					elem = e;
					elem.classList.add("select-goto-item");
					var txt = elem.querySelector(".goto-item-name").textContent;
					document.getElementById('goto-input').value = txt;
					that.gotoelem = { elem: elem, fpath: elem.getAttribute("data-fpath"), spath: elem.getAttribute("data-spath") }
				} else {
					if (!elem) return;
					elem.classList.add("select-goto-item");
					var inpttxt = document.getElementById('goto-input').value;
					if (!/[\:\#\/]{1}/.test(inpttxt)) {
						var txt = elem.querySelector(".goto-item-name").textContent;
						document.getElementById('goto-input').value = txt;
					}
					that.gotoelem = { elem: elem, fpath: elem.getAttribute("data-fpath"), spath: elem.getAttribute("data-spath") }
				}
				if (!elem) return;
				var pid = elem.getAttribute("data-pid")
				var iid = elem.getAttribute("data-iid")
				if (pid === undefined || iid === undefined) return
				var fentry = this.projectitems[pid - 0][iid]
				if (!fentry) return;
				fentry.file(function (file) {
					var reader = new FileReader();
					reader.onloadend = function (e) {
						var editor = ace.edit("editor");
						var ftype = that.checkFileType(fentry.name)
						var session = editor.getSession();
						editor.setValue(this.result, -1);
						session.setMode("ace/mode/" + ftype);
					};
					reader.readAsText(file);
				});
			},
			openGotoItem: function (elem, callback) {
				var that = this;
				if (!elem) {
					if (!this.gotoelem) return;
					elem = this.gotoelem.elem;
					var val = document.getElementById('goto-input').value;
					if (val.indexOf(":") > -1) {
						var line = val.split(":")[1]
						if (/^[0-9]+/.test(line)) {
							callback = function (editor) {
								if (!line) return;
								line = parseInt(line, 10)
								editor.gotoLine(line, 0, false)
							};
						}
					} else if (val.indexOf("#") > -1) {
						var gotoline = that.gotosession;
						callback = function (editor) {
							var line = val.split("#")[1]
							if (!line) return;
							editor.find(line, {
								skipCurrent: false,
								backwards: false,
								wrap: true,
								regExp: true,
								caseSensitive: false,
								wholeWord: false
							});
							var itemcnt = editor.findAll(line, {
								regExp: true,
								caseSensitive: false,
								wholeWord: false,
								countflg: editor.session
							});
							setTimeout(function () {
								if (!gotoline) return
								editor.gotoLine(gotoline - 0, 0, false)
							}, 250)
						};
					}
				}
				var pid = elem.getAttribute("data-pid")
				var iid = elem.getAttribute("data-iid")
				var fentry = that.projectitems[pid - 0][iid]
				if (!fentry) return;
				fentry.file(function (file) {
					var reader = new FileReader();
					reader.onloadend = function (e) {
						that.createTab(this.result, fentry, null, fentry.fullPath, null, callback);
					};
					reader.readAsText(file);
				});
				this.hideGoto();
			},
			searchGotoPreview: function (val, keycode, shift) {
				var that = this;
				if (keycode === "tab") {
					var robj = this.gotorange;
					if (!robj) return;
					var editor = ace.edit("editor");
					if (!robj.ranges[robj.index]) {
						if (shift && robj.ranges && robj.ranges.length > 0) {
							robj.index = robj.ranges.length - 1
						} else {
							robj.index = 0;
						}
					}
					var row = robj.ranges[robj.index].start.row;
					robj.hl = editor.session.highlightLines(row, row, "ace_search_highlight_word");
					editor.gotoLine(row, 0, false)
					this.gotosession = row - 0;
					if (shift) {
						robj.index--;
					} else {
						robj.index++;
					}
				} else {
					document.getElementById('editor').style.zIndex = 1;
					var editor = ace.edit("editor");
					var lines = val.split("#");
					var line = lines[1];
					if (line) {
						line = line.replace(/^\s+|\s+$/g, "");
						editor.find(line, {
							skipCurrent: false,
							backwards: false,
							wrap: true,
							regExp: true,
							caseSensitive: false,
							wholeWord: false
						});
						var itemcnt = editor.findAll(line, {
							regExp: true,
							caseSensitive: false,
							wholeWord: false,
							countflg: editor.session
						});
						var nitemcnt = [];
						if (itemcnt.length > 0) {
							var checkline = [];
							for (var i = 0; i < itemcnt.length; i++) {
								var item = itemcnt[i];
								var statpos = item.start.row + 1;
								if (checkline.indexOf(statpos) !== -1) continue;
								checkline.push(statpos)
								nitemcnt.push(item)
							};
						}
						if (!nitemcnt || nitemcnt.length < 1) {
							this.gotorange = null;
							this.gotosession = null;
						} else {
							var robj = {};
							robj.ranges = nitemcnt;
							robj.index = 0;
							robj.hl = null;
							this.gotorange = robj;
							this.gotosession = nitemcnt[0].start.row;
						}
					}
				}
			},
			jumpGotoPreview: function (val, keycode, shift) {
				document.getElementById('editor').style.zIndex = 1;
				var editor = ace.edit("editor");
				var lines = val.split(":");
				var line = lines[1];
				if (line) {
					line = line.replace(/^\s+|\s+$/g, "");
					editor.gotoLine(line - 0, 0, false)
					this.gotosession = line - 0;
				}
			},
			createUserMenu: function (label, func) {
				if (!label) label = "Custom Menu"
				var ul = document.getElementById("ucom-container");
				var mdli = document.querySelector("#ucom-container .menu-item-md")
				var posli = ul.firstChild;
				var li = document.createElement("li");
				if (mdli) {
					if (mdli.nextSibling) posli = mdli.nextSibling;
				}
				ul.insertBefore(li, posli);
				var a = document.createElement("a");
				a.setAttribute("href", "#");
				li.appendChild(a);
				var spn = document.createElement("span");
				spn.setAttribute("class", "modal-awesome-hinfo submenu");
				a.appendChild(spn);
				var lbl = document.createElement("label");
				spn.appendChild(lbl);
				lbl.textContent = label;
				lbl.style.color = "aquamarine"
				li.addEventListener("mousedown", function () {
					if (func) func();
				}, false);
			},
			openGoogleDriveSync: function (writeflg) {
				var that = this;
				chrome.syncFileSystem.getServiceStatus(function (status) {
					that.showGitInfoModal(status, true)
					chrome.syncFileSystem.requestFileSystem(function (fs) {
						document.getElementById("opengitModal").style.display = "block"
						that.createLocalGitItem(fs.root, true, writeflg)
					});
				});
			},
			saveFolderGoogleDriveSync: function () {
				var that = this;
				chrome.syncFileSystem.getServiceStatus(function (status) {
					that.showGitInfoModal(status, true)
					chrome.syncFileSystem.requestFileSystem(function (fs) {
						chrome.fileSystem.chooseEntry({
							type: "openDirectory"
						}, function (fileEntrie) {
							if (fileEntrie) {
								fileEntrie.copyTo(fs.root)
							}
						});
					});
				});
			},
			saveFileGoogleDriveSync: function () {
				var that = this;
				chrome.syncFileSystem.getServiceStatus(function (status) {
					that.showGitInfoModal(status, true)
					chrome.syncFileSystem.requestFileSystem(function (fs) {
						chrome.fileSystem.chooseEntry({
							type: "openFile",
							acceptsMultiple: false
						}, function (fileEntries) {
							if (fileEntries && fileEntries.isFile) {
								fileEntries.copyTo(fs.root)
							}
						});
					});
				});
			},
			gitCommand: function (url, type, bname, commitobj) {
				var that = this;
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 5 * 1024 * 1024 * 1024, function (fs) {
					fs.root.getDirectory('/' + that.gitdir, { create: true }, function (pdirEntry) {
						if (type === "openlist") {
							that.createLocalGitItem(pdirEntry)
							return;
						}
						var urls = url.split("/");
						var name = urls[urls.length - 1];
						fs.root.getDirectory('/' + that.gitdir + '/' + name, { create: true }, function (dirEntry) {
							if (type === "removeall") {
								dirEntry.removeRecursively(function () {
									that.showGitInfoModal("Success Remove")
								}, function () {
									that.showGitInfoModal("Error Remove")
								});
							} else if (type === "clone") {
								var options = {
									dir: dirEntry,
									url: url,
									depth: 1
								};
								if (that.optobj.gitusername && that.optobj.gituserpass) {
									options.username = that.optobj.gitusername;
									options.password = that.optobj.gituserpass;
								}
								GitApi.clone(options, function (e) {
									document.getElementById("loadingModal").style.display = "none"
									that.gitinfo.url = url;
									that.gitinfo.name = name;
									var obj = {};
									obj.url = url;
									obj.name = name;
									that.gitprojects.push(obj)
									that.__openfolderexec([dirEntry], 0);
									that.showGitInfoModal("Success Clone")
								}, function () {
									document.getElementById("loadingModal").style.display = "none"
									that.showGitInfoModal("Error Clone")
								});
							} else if (type === "write") {
								that.gitWriteFolder(dirEntry);
							} else if (type === "addfiles") {
								that.gitAddFiles(dirEntry)
							} else if (type === "addfolder") {
								that.gitAddFolder(dirEntry)
							} else if (that.optobj.gitusername && that.optobj.gituserpass) {
								if (type === "push") {
									var options = {
										dir: dirEntry,
										url: url,
										username: that.optobj.gitusername,
										password: that.optobj.gituserpass
									};
									GitApi.push(options, function (e) {
										that.showGitInfoModal("Success Push")
									}, function () {
										that.showGitInfoModal("Error Push")
									});
								} else if (type === "pull") {
									var options = {
										dir: dirEntry,
										url: url,
										username: that.optobj.gitusername,
										password: that.optobj.gituserpass
									};
									GitApi.pull(options, function (e) {
										that.showGitInfoModal("Success Pull")
									}, function () {
										that.showGitInfoModal("Error Pull")
									});
								} else if (type === "commit") {
									var options = {
										dir: dirEntry,
										name: commitobj.name,
										email: commitobj.mail,
										commitMsg: commitobj.message
									};
									GitApi.commit(options, function (e) {
										that.showGitInfoModal("Success Commit")
									}, function () {
										that.showGitInfoModal("Error Commit")
									});
								} else if (type === "branch") {
									GitApi.branch({ dir: dirEntry, branch: bname }, function () {
										GitApi.checkout({ dir: dirEntry, branch: bname }, function () {
											that.showGitInfoModal("Success Branch")
										}, function () {
											that.showGitInfoModal("Error Branch")
										});
									}, function () {
										that.showGitInfoModal("Error Branch")
									});
								} else if (type === "checkout-show") {
									document.getElementById("gitcheckoutcurrent-disp").textContent = that.gitinfo.name;
									document.getElementById("githubCheckoutModal").style.display = "block";
									var options = {
										dir: dirEntry
									};
									GitApi.getCurrentBranch(options, function (e) {
										var current = e;
										var options = {
											dir: dirEntry
										};
										document.getElementById("current-branch").textContent = "Current: " + current;
										GitApi.getLocalBranches(options, function (e) {
											var list = e;
											var cont = document.getElementById("select-branch");
											createitem(cont, list, current);
										});
										function createitem(cont, list, current) {
											$(cont).empty();
											for (var i = 0; i < list.length; i++) {
												var item = list[i];
												var opt = document.createElement('option');
												opt.value = item;
												opt.textContent = item;
												cont.appendChild(opt);
												if (item === current) {
													cont.selectedIndex = i;
												}
											}
										}
									}, function () {
										document.getElementById("current-branch").textContent = "";
										document.getElementById("githubCheckoutModal").style.display = "block";
										var cont = document.getElementById("select-branch");
										$(cont).empty();
									});
								} else if (type === "checkout") {
									GitApi.checkout({ dir: dirEntry, branch: bname }, function () {
										that.showGitInfoModal("Success Checkout")
									}, function () {
										that.showGitInfoModal("Error Checkout")
									});
								}
							}
						});
					});
				});
			},
			gitAddFiles: function (dirEntry) {
				var that = this;
				chrome.fileSystem.chooseEntry({
					type: "openFile",
					acceptsMultiple: true
				}, function (fileEntries) {
					if (fileEntries && fileEntries.length > 0) {
						var read = function (fileEntries, idx) {
							fileEntries[idx].copyTo(dirEntry, null, function () {
								idx++;
								if (fileEntries[idx]) {
									read(fileEntries, idx)
								} else {
									that.gitReload();
								}
							});
						};
						read(fileEntries, 0)
					}
				});
			},
			gitAddFolder: function (dirEntry) {
				var that = this;
				chrome.fileSystem.chooseEntry({
					type: "openDirectory"
				}, function (fileEntrie) {
					if (fileEntrie) {
						fileEntrie.copyTo(dirEntry, null, function () {
							that.gitReload();
						});
					}
				});
			},
			gitReload: function () {
				var that = this;
				for (var i = 0; i < that.projectitems.length; i++) {
					var pitem = that.projectitems[i];
					if (!pitem) continue;
					var keys = Object.keys(pitem);
					if (keys[0].indexOf(that.gitdir) > -1) {
						setTimeout(function () {
							document.getElementById("reload_folder" + i).click();
						}, 1500)
						break;
					}
				}
			},
			gitWriteFolder: function (fs) {
				var that = this;
				var ary = [];
				var pobj = {};
				pobj.children = [];
				pobj.fentry = fs;
				pobj.name = fs.name;
				var cb = function (root) {
					chrome.fileSystem.chooseEntry({
						type: "openDirectory"
					}, function (rootentry) {
						if (rootentry) {
							that.createDLTree(ary, [pobj], rootentry);
						}
					});
				};
				that.onInitFs(fs, ary, null, pobj, fs, cb, -1000)
			},
			createDLTree: function (items, pobjs, rootentry) {
				var that = this;
				function createfolder(rootentry, item) {
					rootentry.getDirectory(item.name, { create: true }, function (dirEntry) {
						that.createDLTree(items, item.children, dirEntry);
					});
				}
				function createfile(rootentry, item) {
					rootentry.getFile(item.name, { create: true }, function (fileEntry) {
						fileEntry.createWriter(function (fileWriter) {
							item.file(function (file) {
								var reader = new FileReader();
								reader.onload = function (e) {
									var blob = new Blob([this.result]);
									fileWriter.onwriteend = function (e) {
										fileWriter.onwriteend = function () {
										};
										fileWriter.truncate(blob.size);
									};
									fileWriter.write(blob);
								};
								reader.readAsArrayBuffer(file);
							});
						});
					});
				}
				for (var i = 0; i < pobjs.length; i++) {
					var item = pobjs[i];
					if (item.isFile) {
						createfile(rootentry, item);
					} else {
						createfolder(rootentry, item);
					}
				}
			},
			gitSaveItem: function (blob, fentry, callbak) {
				var that = this;
				var windowrequestfilesystem = window.requestFileSystem || window.webkitRequestFileSystem;
				windowrequestfilesystem(window.PERSISTENT, 10 * 1024 * 1024, function (fs) {
					fs.root.getFile(fentry.fullPath, { create: true }, function (fileEntry) {
						fileEntry.createWriter(function (fileWriter) {
							fileWriter.onwriteend = function () {
								fileWriter.onwriteend = function () {
									if (callbak) callbak();
								};
								fileWriter.truncate(blob.size);
							};
							fileWriter.write(blob);
						});
					});
				});
			},
			createLocalGitItem: function (fs, gsyncflg, writeflg) {
				var that = this;
				var entries = [];
				var dirReader = fs.createReader();
				var readEntries = function () {
					dirReader.readEntries(function (results) {
						if (!results.length) {
							createelement(entries);
						} else {
							entries = entries.concat(toArray(results));
							readEntries();
						}
					});
				};
				readEntries();
				function toArray(list) { return Array.prototype.slice.call(list || [], 0) }
				function createelement(entries) {
					var cont = document.getElementById("git-local-list");
					$(cont).empty();

					for (var i = 0, len = entries.length; i < len; i++) {
						var item = entries[i];
						var div = document.createElement("div");
						cont.appendChild(div);
						div.setAttribute("class", "project-item");
						div.addEventListener("click", clickItem, false);
						div.index = i;

						var close = document.createElement("span");
						div.appendChild(close);
						close.setAttribute("class", "project-item-close");
						close.index = i;
						close.addEventListener("click", clickClose, false);

						var spanelm = document.createElement("span");
						div.appendChild(spanelm);
						spanelm.appendChild(document.createTextNode(item.name));
					}
					function clickClose(e) {
						e.stopPropagation();
						var prnt = this.parentNode;
						var idx = this.index;
						var item = entries[idx];
						prnt.style.display = "none";
						if (gsyncflg) {
							if (item.isFile) {
								item.remove(function () {
									that.showGitInfoModal("Success Remove")
								}, function () {
									that.showGitInfoModal("Error Remove")
								});
							} else if (item.isDirectory) {
								item.removeRecursively(function () {
									that.showGitInfoModal("Success Remove")
								}, function () {
									that.showGitInfoModal("Error Remove")
								});
							}
						} else {
							that.gitCommand(item.name, "removeall");
						}
					}
					function clickItem(e) {
						e.stopPropagation();
						var idx = this.index;
						var item = entries[idx];
						that.gitinfo.url = null;
						that.gitinfo.name = null;
						readconfigjson(item)
						document.getElementById('closegitModal').click();
					}
					function readconfigjson(item, rmflg) {
						if (writeflg) {
							if (item.isFile) {
								chrome.fileSystem.chooseEntry({ 'type': 'saveFile', 'suggestedName': item.name }, function (fileEntry) {
									if (!fileEntry) return;
									item.file(function (file) {
										fileEntry.createWriter(function (fileWriter) {
											fileWriter.onwriteend = function (e) {
												fileWriter.onwriteend = function () {
												};
												fileWriter.truncate(file.size);
											};
											fileWriter.write(file);
										});
									})
								});
							} else if (item.isDirectory) {
								that.gitWriteFolder(item);
							}
						} else if (gsyncflg) {
							if (item.isFile) {
								that.checkFileEntry([item], null, null);
							} else if (item.isDirectory) {
								that.__openfolderexec([item], 0);
							}
						} else {
							item.getDirectory(".git", { create: false }, function (dirEntry) {
								dirEntry.getFile("config.json", { create: false }, function (fileEntry) {
									fileEntry.file(function (file) {
										var reader = new FileReader();
										reader.onloadend = function (e) {
											var txt = this.result;
											var json = JSON.parse(txt)
											var url = json.url;
											var urls = url.split("/");
											var name = urls[urls.length - 1];
											if (rmflg) {
												that.gitCommand(url, "removeall");
											} else {
												that.gitinfo.url = url;
												that.gitinfo.name = name;
												var obj = {};
												obj.url = url;
												obj.name = name;
												that.gitprojects.push(obj)
												that.__openfolderexec([item], 0);
											}
										};
										reader.readAsText(file);
									});
								}, function () {
								});
							}, function () {

							});
						}
					}
				}
			},
			showGitModal: function (plchldr) {
				var elem = document.getElementById("githubURLModal");
				elem.style.display = "block";
				setTimeout(function () {
					elem.style.opacity = 1;
					var inpt = document.getElementById('open-github-input');
					inpt.setAttribute("placeholder", plchldr)
					inpt.value = "";
					inpt.focus();
				}, 20);
			},
			showGitCommitModal: function () {
				var that = this;
				document.getElementById("gitcommitcurrent-disp").textContent = that.gitinfo.name;
				document.getElementById("githubCommitModal").style.display = "block";
				setTimeout(function () {
					if (that.optobj.gitusername && that.optobj.gituserpass) {
						document.getElementById('git-commit-username-input').value = that.optobj.gitusername;
						document.getElementById('git-commit-useremail-input').value = that.optobj.gitusermail;
					}
					var inpt = document.getElementById('git-commit-message-input');
					inpt.value = "";
					inpt.focus();
				}, 20);
			},
			showGitInfoModal: function (message, ngit) {
				var that = this;
				document.getElementById("githubIonfModal").style.display = "block";
				if (ngit) {
					document.getElementById("github-info-disp").textContent = message;
				} else {
					document.getElementById("github-info-disp").textContent = that.gitinfo.name + " : " + message;
				}
				setTimeout(function () {
					document.getElementById("githubIonfModal").style.display = "none";
				}, 1200);
			},
			checkCurrentProjectID: function () {
				var that = this;
				var tab = this.tabs[this.selecttabid];
				var txtobj = this.textobjs[tab.textid];
				var entry = txtobj.fentry;
				if (entry) {
					var crntpid = -1;
					for (var i = 0; i < that.projectitems.length; i++) {
						var pitem = that.projectitems[i];
						if (!pitem) continue;
						var item = pitem[entry.fullPath];
						if (item) {
							crntpid = i;
							break;
						}
					}
					return crntpid;
				} else {
					return -1;
				}
			},
			showWebView: function (url, ua) {
				var that = this;
				if (!url) {
					var tab = this.tabs[this.selecttabid];
					var txtobj = this.textobjs[tab.textid];
					if (tab && txtobj && txtobj.fentry.fullPath && txtobj.fentry) {
						var port = this.optobj.server_port;
						var time = 400;
						url = "http://127.0.0.1:" + port;
						var tab = this.tabs[this.selecttabid];
						var txtobj = this.textobjs[tab.textid];
						var entry = txtobj.fentry;
						var crntpid = that.checkCurrentProjectID();
						chrome.runtime.getBackgroundPage(function (bg) {
							if (crntpid !== -1) {
								var dentry = that.currentfolderentrys[crntpid - 0];
								if (dentry) {
									var path = entry.fullPath.split(dentry.fullPath + "/")[1];
									entry = dentry;
									url = "http://127.0.0.1:" + port + "/" + path;
									time = 500;
								}
							}
							window.entry = entry
							bg.entry = entry
							bg.haveentry(entry)
							setTimeout(function () {
								bg.statServer(true, url, port);
							}, 200);
							setTimeout(function () {
								show(url)
							}, time);
						});
					} else {
						var that = this;
						url = "about:blank"
						show(url)
					}
				} else {
					show(url)
				}
				function show(url) {
					if (ua) {
						document.getElementById("webview").setUserAgentOverride(ua);
						setTimeout(function () {
							document.getElementById("webview").setAttribute("src", url);
						}, 750)
					} else {
						setTimeout(function () {
							document.getElementById("webview").setAttribute("src", url);
						}, 250)
					}
					document.getElementById("main-webview-container").style.height = "calc(100% - 27px)";
					document.getElementById("main-webview-container").style.display = "block";
					setTimeout(function () {
						document.getElementById("main-webview-container").style.top = "28px"
					}, 30)
				}
			},
			hideWebView: function () {
				var that = this;
				document.getElementById("webview").setAttribute("src", "about:blank");
				document.getElementById("main-webview-container").style.top = window.innerHeight * -1 + "px";
				setTimeout(function () {
					document.getElementById("main-webview-container").style.height = 0;
				}, 500)
			},
			createWebviewButton: function (txt, url, ua) {
				if (!txt) txt = "No Title";
				var webv = document.getElementById("webview-button-container");
				var li = document.createElement("li");
				var a = document.createElement("a");
				var span = document.createElement("span");
				var label = document.createElement("label");

				webv.appendChild(li)
				li.appendChild(a)
				a.setAttribute("href", "#");
				a.appendChild(span)
				span.setAttribute("class", "webviewitem submenu");
				span.appendChild(label)
				label.appendChild(document.createTextNode(txt))
				span.addEventListener("click", function () {
					simpleEditor.showWebView(url, ua);
				})
			},
			resizeWebview: function (val) {
				var that = this;
				document.getElementById("main-webview-container").style.left = val + "px";
				clearTimeout(this.savestatetimerid);
				this.savestatetimerid = setTimeout(function () {
					that.optobj.webview_preview = val;
					that.saveOptions();
				}, 400)
			},
			toggleWebview: function () {
				if (document.getElementById("main-webview-container").style.display !== "none") {
					this.hideWebView();
				} else {
					this.showWebView();
				}
			},
			getCurrentTab: function () {
				if (this.tabs.length > 0 && (this.selecttabid || this.selecttabid === 0)) {
					return this.tabs[this.selecttabid];
				} else {
					return null;
				}
			},
			getTab: function (tabid) {
				if (this.tabs.length > 0 && this.tabs[tabid]) {
					return this.tabs[tabid];
				} else {
					return null;
				}
			},
			getAlltabs: function () {
				var nary = [];
				for (var i = 0; i < this.tabs.length; i++) {
					var item = this.tabs[i];
					if (item) {
						nary.push(item)
					}
				};
				return nary
			},
			getCurrentEditor: function () {
				if (this.tabs.length > 0 && (this.selecttabid || this.selecttabid === 0)) {
					return this.tabs[this.selecttabid].editor;
				} else {
					return null;
				}
			},
			getEditor: function (tabid) {
				if (this.tabs.length > 0 && this.tabs[tabid] && this.tabs[tabid].editor) {
					return this.tabs[tabid].editor;
				} else {
					return null;
				}
			},
			getCurrentText: function () {
				if (this.tabs.length > 0 && (this.selecttabid || this.selecttabid === 0)) {
					return this.textobjs[this.tabs[this.selecttabid].textid];
				} else {
					return null;
				}
			},
			getText: function (tabid) {
				if (this.tabs.length > 0 && this.tabs[tabid] && this.textobjs[this.tabs[tabid].textid]) {
					return this.textobjs[this.tabs[tabid].textid];
				} else {
					return null;
				}
			},
			getAllText: function () {
				return this.textobjs;
			},
			createNewTab: function (text, callback) {
				this.createTab(text, null, null, null, null, callback);
			},
			saveTabText: function (tabid, saveas, callback) {
				this.saveText(null, saveas, callback, tabid);
			},
			loadState: function () {
				var that = this;
				var callback = function () {
					that.loadCustomTheme();
					chrome.storage.local.get("_state_", function (obj) {
						var sobj = obj["_state_"];
						if (sobj) {
							that.projectwidth = sobj - 0;
						}
						that.checkExtCustomKeys(true);
						that.loadUserCommand();
						if (that.optobj.show_sidebar) that.toggleProjectManager(true, true)
					});
				};
				that.loadOptions(callback);
			},
			init: function () {
				this.loadState();
				this.createHistoryItem();
				addEvent(this);
			}
		};
		simpleEditor.init();
	}
});
function addEvent(simpleEditor) {
	var gototimerid = null;
	var resizeflg = false, currentwidth = 0;
	var resizeWebviewflg = false;
	window.addEventListener("resize", function () { simpleEditor.adjustTab() }, true)
	document.getElementsByClassName("modal-awesome-minus")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-close")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-full")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-settings")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-new")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-open")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-print")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-file")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-insert")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-folder")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-splitv")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-splith")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-resetsplit")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-newview")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-split")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-save")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-saveas")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-saveall")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-omenu")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-show-project-manager")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-custheme")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-rmtheme")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-excustkey")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-custkey")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-server")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-stopserver")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-zip")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-charset")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-saveascrlf")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-saveaslf")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-about")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-snippet")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-ehigh")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-createps")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-createpn")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-createpo")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-createpe")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-shortcuts")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-api")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-uinit")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-githubdl")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-chromeext")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-chromeapp")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-webapp")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-addedtior")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-newwindow")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-ufextensin")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-gitusersetting")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-gitclone")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-gitopen")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-gitcommit")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-gitpush")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-gitpull")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-gitbranch")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-gitcheckout")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-gitwrite")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-webviewpre")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-chromeapi")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-webhtmltag")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-chromeexapi")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-webcss")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-webjs")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-webapi")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-webview-start")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-webclose")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-reload")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-webback")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-webpre")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-webclear")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-splitnewv")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-splitnewh")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-opengsync")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-savegsync")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-savegsyncf")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-writegsync")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-gitaddfiles")[0].addEventListener("click", clickFrameItem, false);
	document.getElementsByClassName("modal-awesome-gitaddfolder")[0].addEventListener("click", clickFrameItem, false);

	function clickFrameItem(e) {
		if (this.classList.contains("modal-awesome-close")) {
			if (!simpleEditor.checkChangeFlag()) {
				chrome.app.window.current().close();
			} else {
				document.getElementById("exitModal").style.display = "block";
			}
		} else if (this.classList.contains("modal-awesome-minus")) {
			chrome.app.window.current().minimize();
		} else if (this.classList.contains("modal-awesome-full")) {
			simpleEditor.setFullScreen();
		} else if (this.classList.contains("modal-awesome-settings")) {
			simpleEditor.showOptions();
		} else if (this.classList.contains("modal-awesome-file") || this.classList.contains("modal-awesome-open")) {
			simpleEditor.__openfile();
		} else if (this.classList.contains("modal-awesome-folder")) {
			simpleEditor.__openfolder();
		} else if (this.classList.contains("modal-awesome-new")) {
			simpleEditor.createEmptyTab();
		} else if (this.classList.contains("modal-awesome-splitv")) {
			simpleEditor.setSplitScreen(0);
		} else if (this.classList.contains("modal-awesome-splith")) {
			simpleEditor.setSplitScreen(1);
		} else if (this.classList.contains("modal-awesome-resetsplit")) {
			simpleEditor.setSplitScreen(0, true);
		} else if (this.classList.contains("modal-awesome-splitnewv")) {
			simpleEditor.__openfile(null, 0);
		} else if (this.classList.contains("modal-awesome-splitnewh")) {
			simpleEditor.__openfile(null, 1);
		} else if (this.classList.contains("modal-awesome-newview") || this.classList.contains("modal-awesome-split")) {
			simpleEditor.setNewView();
		} else if (this.classList.contains("modal-awesome-save")) {
			simpleEditor.saveText();
		} else if (this.classList.contains("modal-awesome-saveas")) {
			simpleEditor.saveText(null, true);
		} else if (this.classList.contains("modal-awesome-saveall")) {
			simpleEditor.saveAllText();
		} else if (this.classList.contains("modal-awesome-omenu")) {
			simpleEditor.saveText();
		} else if (this.classList.contains("modal-awesome-show-project-manager")) {
			simpleEditor.toggleProjectManager();
		} else if (this.classList.contains("modal-awesome-insert")) {
			simpleEditor.__insertfile();
		} else if (this.classList.contains("modal-awesome-zip")) {
			simpleEditor.__openZipfile();
		} else if (this.classList.contains("modal-awesome-custheme")) {
			simpleEditor.loadCustomTheme(true);
		} else if (this.classList.contains("modal-awesome-ufextensin")) {
			simpleEditor.loadUserFileNameExtension(true);
		} else if (this.classList.contains("modal-awesome-rmtheme")) {
			simpleEditor.removeCustomTheme();
		} else if (this.classList.contains("modal-awesome-excustkey")) {
			simpleEditor.loadExtCustomKeys(null, true)
		} else if (this.classList.contains("modal-awesome-custkey")) {
			simpleEditor.loadDefaultKeys(null, true);
		} else if (this.classList.contains("modal-awesome-print")) {
			simpleEditor.printTxt();
		} else if (this.classList.contains("modal-awesome-server")) {
			var idx = simpleEditor.checkCurrentProjectID();
			simpleEditor.startServer(idx);
		} else if (this.classList.contains("modal-awesome-stopserver")) {
			simpleEditor.stopServer();
		} else if (this.classList.contains("modal-awesome-saveascrlf")) {
			simpleEditor.saveText("win", true);
		} else if (this.classList.contains("modal-awesome-saveaslf")) {
			simpleEditor.saveText("linux", true);
		} else if (this.classList.contains("modal-awesome-uinit")) {
			simpleEditor.loadUserInitScript(true);
		} else if (this.classList.contains("modal-awesome-shortcuts")) {
			window.open("https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts")
		} else if (this.classList.contains("modal-awesome-api")) {
			window.open("http://ace.c9.io/#nav=api")
		} else if (this.classList.contains("modal-awesome-createpn")) {
			var pobj = {};
			pobj.name = "Project";
			pobj.folders = [];
			pobj.id = simpleEditor.optobj.projectid;
			pobj.extype = "";
			pobj.exfldr = "";
			simpleEditor.currentproject = pobj;
			simpleEditor.openEditProject()
		} else if (this.classList.contains("modal-awesome-createps")) {
			chrome.storage.local.get("__pre__folder", function (obj) {
				var sobj = obj["__pre__folder"];
				if (sobj) {
					var pobj = {};
					pobj.name = "Project";
					pobj.folders = sobj;
					pobj.id = simpleEditor.optobj.projectid;
					pobj.extype = "";
					pobj.exfldr = "";
					simpleEditor.currentproject = pobj;
					simpleEditor.openEditProject()
				}
			});
		} else if (this.classList.contains("modal-awesome-createpe")) {
			var crntid = simpleEditor.preprojectid;
			if (crntid > -1) {
				var pobj = simpleEditor.optobj.storeprojectitems[crntid - 0];
				if (!pobj) return;
				simpleEditor.currentproject = pobj;
				simpleEditor.openEditProject()
			}
		} else if (this.classList.contains("modal-awesome-createpo")) {
			simpleEditor.openProjectItems();
		} else if (this.classList.contains("modal-awesome-charset")) {
			var modal = document.getElementById("charseModal");
			modal.style.display = "block"
			setTimeout(function () {
				modal.style.opacity = 1;
			}, 50)
		} else if (this.classList.contains("modal-awesome-about")) {
			var modal = document.getElementById("aboutModal");
			modal.style.display = "block"
			setTimeout(function () {
				modal.style.opacity = 1;
			}, 50)
		} else if (this.classList.contains("modal-awesome-snippet")) {
			simpleEditor.setSplitScreen(null, true, true);
		} else if (this.classList.contains("modal-awesome-ehigh")) {
			var editor = simpleEditor.tabs[simpleEditor.selecttabid].editor;
			var session = editor.getSession();
			var emode = session.getMode().$id;
			var modes = emode.split("/");
			var mode = modes[modes.length - 1];
			simpleEditor.loadHighlightRules(true, editor, mode, session);
		} else if (this.classList.contains("modal-awesome-chromeapp")) {
			simpleEditor.__openGithubURL("template/ChromeApps.zip", "chrome-apps")
		} else if (this.classList.contains("modal-awesome-chromeext")) {
			simpleEditor.__openGithubURL("template/ChromeExtension.zip", "chrome-extension")
		} else if (this.classList.contains("modal-awesome-webapp")) {
			simpleEditor.__openGithubURL("template/webApp.zip", "web-app")
		} else if (this.classList.contains("modal-awesome-newwindow")) {
			chrome.runtime.getBackgroundPage(function (bg) {
				var crntw = chrome.app.window.current();
				bg.launchSimpleEditor({ w: crntw.outerBounds.width, h: crntw.outerBounds.height });
			});
		} else if (this.classList.contains("modal-awesome-addedtior")) {
			simpleEditor.loadEditorScript(true)
		} else if (this.classList.contains("modal-awesome-gitusersetting")) {
			if (simpleEditor.optobj.gitusername && simpleEditor.optobj.gituserpass) {
				document.getElementById("git-username-input").value = simpleEditor.optobj.gitusername;
				document.getElementById("git-userpassword-input").value = simpleEditor.optobj.gituserpass;
				document.getElementById("git-useremail-input").value = simpleEditor.optobj.gitusermail;
			}
			simpleEditor.saveOptions();
			document.getElementById("gitUserModal").style.display = "block"
		} else if (this.classList.contains("modal-awesome-gitopen")) {
			simpleEditor.gitCommand(null, "openlist");
			document.getElementById("opengitModal").style.display = "block"
		} else if (this.classList.contains("modal-awesome-gitcommit")) {
			simpleEditor.showGitCommitModal();
		} else if (this.classList.contains("modal-awesome-gitwrite")) {
			if (simpleEditor.gitinfo && simpleEditor.gitinfo.url) simpleEditor.gitCommand(simpleEditor.gitinfo.url, "write");
		} else if (this.classList.contains("modal-awesome-gitpush")) {
			if (simpleEditor.gitinfo && simpleEditor.gitinfo.url) simpleEditor.gitCommand(simpleEditor.gitinfo.url, "push");
		} else if (this.classList.contains("modal-awesome-gitpull")) {
			if (simpleEditor.gitinfo && simpleEditor.gitinfo.url) simpleEditor.gitCommand(simpleEditor.gitinfo.url, "pull");
		} else if (this.classList.contains("modal-awesome-gitcheckout")) {
			if (simpleEditor.gitinfo && simpleEditor.gitinfo.url) simpleEditor.gitCommand(simpleEditor.gitinfo.url, "checkout-show");
		} else if (this.classList.contains("modal-awesome-gitaddfiles")) {
			if (simpleEditor.gitinfo && simpleEditor.gitinfo.url) simpleEditor.gitCommand(simpleEditor.gitinfo.url, "addfiles");
		} else if (this.classList.contains("modal-awesome-gitaddfolder")) {
			if (simpleEditor.gitinfo && simpleEditor.gitinfo.url) simpleEditor.gitCommand(simpleEditor.gitinfo.url, "addfolder");
		} else if (this.classList.contains("modal-awesome-gitclone")) {
			simpleEditor.gitclonemode = "clone";
			simpleEditor.showGitModal("https://github.com/ajaxorg/ace.git");
		} else if (this.classList.contains("modal-awesome-gitbranch")) {
			document.getElementsByClassName("git-reopen-label")[0].style.display = "block";
			simpleEditor.gitclonemode = "branch";
			simpleEditor.showGitModal("Branch Name");
		} else if (this.classList.contains("modal-awesome-githubdl")) {
			simpleEditor.gitclonemode = false;
			simpleEditor.showGitModal("https://github.com/ajaxorg/ace.git");
		} else if (this.classList.contains("modal-awesome-webview-start")) {
			simpleEditor.showWebView();
		} else if (this.classList.contains("modal-awesome-webviewpre")) {
			simpleEditor.showWebView();
		} else if (this.classList.contains("modal-awesome-webhtmltag")) {
			simpleEditor.showWebView("https://developer.mozilla.org/en-US/docs/Web/HTML");
		} else if (this.classList.contains("modal-awesome-webcss")) {
			simpleEditor.showWebView("https://developer.mozilla.org/en-US/docs/Web/CSS");
		} else if (this.classList.contains("modal-awesome-webjs")) {
			simpleEditor.showWebView("https://developer.mozilla.org/en-US/docs/Web/JavaScript");
		} else if (this.classList.contains("modal-awesome-webapi")) {
			simpleEditor.showWebView("https://developer.mozilla.org/en-US/docs/Web/API");
		} else if (this.classList.contains("modal-awesome-chromeexapi")) {
			simpleEditor.showWebView("https://developer.chrome.com/extensions/api_index");
		} else if (this.classList.contains("modal-awesome-chromeapi")) {
			simpleEditor.showWebView("https://developer.chrome.com/apps/api_index");
		} else if (this.classList.contains("modal-awesome-webclose")) {
			simpleEditor.hideWebView();
		} else if (this.classList.contains("modal-awesome-reload")) {
			document.getElementById("webview").reload();
		} else if (this.classList.contains("modal-awesome-webback")) {
			var webview = document.getElementById("webview");
			if (webview.canGoBack()) webview.back()
		} else if (this.classList.contains("modal-awesome-webpre")) {
			var webview = document.getElementById("webview");
			if (webview.canGoForward()) webview.forward()
		} else if (this.classList.contains("modal-awesome-webclear")) {
			var webview = document.getElementById("webview");
			webview.clearData({}, { appcache: true, cache: true, fileSystems: true, indexedDB: true, localStorage: true, webSQL: true }, function () {
				simpleEditor.showGitInfoModal("Clear Data", true)
			})
		} else if (this.classList.contains("modal-awesome-opengsync")) {
			simpleEditor.openGoogleDriveSync();
		} else if (this.classList.contains("modal-awesome-savegsync")) {
			simpleEditor.saveFolderGoogleDriveSync();
		} else if (this.classList.contains("modal-awesome-savegsyncf")) {
			simpleEditor.saveFileGoogleDriveSync();
		} else if (this.classList.contains("modal-awesome-writegsync")) {
			simpleEditor.openGoogleDriveSync(true);
		}
	}
	document.getElementById("project-resize").addEventListener("mousedown", function (e) {
		resizeflg = e.pageX;
		currentwidth = simpleEditor.projectwidth;
	}, false)
	document.documentElement.addEventListener("mouseup", function (e) {
		resizeflg = false;
		resizeWebviewflg = false;
		currentwidth = 0;
	}, true)
	document.documentElement.addEventListener("mousemove", function (e) {
		if (resizeflg) {
			var pos = currentwidth + e.pageX - resizeflg;
			simpleEditor.resizeProjectManager(pos);
		}
		if (resizeWebviewflg) {
			simpleEditor.resizeWebview(e.pageX);
		}
	}, false)
	document.getElementById("webview-resize").addEventListener("mousedown", function (e) {
		resizeWebviewflg = e.pageX;
	}, false)
	document.getElementById("mode").addEventListener("change", function () {
		simpleEditor.saveOptions(true);
	});
	document.getElementById("theme").addEventListener("change", function () {
		simpleEditor.saveOptions();
	});
	document.getElementById("backimg").addEventListener("click", function () {
		simpleEditor.hideOptions();
	});
	document.getElementById("open-charset-input").addEventListener("click", function () {
		simpleEditor.__openCharsetfile();
	});
	document.getElementById("char-set-select").addEventListener("click", function (e) {
		e.stopPropagation();
	}, true);
	document.getElementById("char-set-select").addEventListener("change", function (e) {
		simpleEditor.saveOptions();
	}, true);
	document.getElementById("aboutModal").addEventListener("click", function () {
		this.style.opacity = 0;
		this.style.display = "none";
	}, false);
	document.getElementById("charseModal").addEventListener("click", function () {
		this.style.opacity = 0;
		this.style.display = "none";
	}, false);
	document.getElementById("imageModal").addEventListener("click", function () {
		this.style.opacity = 0;
		this.style.display = "none";
	}, false);
	document.getElementById("confirm-button-ok").addEventListener("click", function () {
		var func = simpleEditor.confirmsavefunc;
		simpleEditor.confirmsavefunc = null;
		simpleEditor.confirmfunc = null;
		if (func) func();
		document.getElementById("alartModal").style.display = "none"
	}, false);
	document.getElementById("confirm-button-cancel").addEventListener("click", function () {
		document.getElementById("alartModal").style.display = "none"
	}, false);
	document.getElementById("confirm-button-dont").addEventListener("click", function () {
		var func = simpleEditor.confirmfunc;
		simpleEditor.confirmsavefunc = null;
		simpleEditor.confirmfunc = null;
		if (func) func();
		document.getElementById("alartModal").style.display = "none"
	}, false);
	document.getElementById("confirmexit-button-cancel").addEventListener("click", function () {
		document.getElementById("exitModal").style.display = "none"
	}, false);
	document.getElementById("confirmexit-button-exit").addEventListener("click", function () {
		chrome.app.window.current().close();
	}, false);
	window.addEventListener("dragover", function (e) {
		e.preventDefault();
		e.stopPropagation();
	}, true);
	window.addEventListener("dragleave", function (e) {
		e.preventDefault();
		e.stopPropagation();
	}, true);
	window.addEventListener("drop", function (e) {
		e.preventDefault();
		e.stopPropagation();
		simpleEditor.__dropLocalFile(e);
	}, true);
	document.getElementById('closediffModal').addEventListener("click", function (e) {
		var that = document.getElementById('diffModal');
		that.style.opacity = 0;
		setTimeout(function () {
			that.style.display = "none";
		}, 300);
		document.getElementById('diff-main-container').style.display = "none";
		document.getElementById('diff-text-container').style.display = "block";
	}, false);
	document.getElementById('closeFindModal').addEventListener("click", function (e) {
		var that = document.getElementById('findModal');
		that.style.opacity = 0;
		document.getElementById('find-replaceall-container').style.display = "none";
		setTimeout(function () {
			that.style.display = "none";
		}, 300);
	}, false);
	document.getElementById('new-window-button').addEventListener("click", function (e) {
		chrome.runtime.getBackgroundPage(function (bg) {
			var crntw = chrome.app.window.current();
			bg.launchSimpleEditor({ w: crntw.outerBounds.width, h: crntw.outerBounds.height });
		});
	}, false);
	document.getElementById('find-search-replaceall').addEventListener("click", function (e) {
		var val = document.getElementById('find-input-replaceall').value;
		simpleEditor.clickFindReplaceAllItem(val);
	}, false);
	document.getElementById('find-search-start').addEventListener("click", function (e) {
		simpleEditor.startFind();
	}, false);
	document.getElementById('diff-open-button1').addEventListener("click", function (e) {
		simpleEditor.openTextAceDiff()
	}, false);
	document.getElementById('diff-open-button2').addEventListener("click", function (e) {
		simpleEditor.openTextAceDiff(true)
	}, false);
	document.getElementById('diff-open-start').addEventListener("click", function (e) {
		simpleEditor.creatAceDiff();
	}, false);
	document.getElementById('closeAddProjectModal').addEventListener("click", function (e) {
		var that = document.getElementById('addProjectModal');
		that.style.opacity = 0;
		setTimeout(function () {
			that.style.display = "none";
		}, 300);
	}, false);
	document.getElementById('project-add-folder-button').addEventListener("click", function (e) {
		simpleEditor.addProjectFolder();
	}, false);
	document.getElementById('project-add-button').addEventListener("click", function (e) {
		simpleEditor.addProject();
	}, false);
	document.getElementById('closeOpenProjectModal').addEventListener("click", function (e) {
		var that = document.getElementById('openProjectModal');
		that.style.opacity = 0;
		setTimeout(function () {
			that.style.display = "none";
		}, 300);
	}, false);
	document.getElementById('diff-down').addEventListener("click", function (e) {
		simpleEditor.nextAceDiff();
	}, false);
	document.getElementById('diff-up').addEventListener("click", function (e) {
		simpleEditor.preAceDiff();
	}, false);
	document.getElementById('closeMarkdownModal').addEventListener("click", function (e) {
		var that = document.getElementById('markdownModal');
		that.style.opacity = 0;
		setTimeout(function () {
			that.style.display = "none";
		}, 300);
	}, false);
	document.getElementById('clear-markdown-button').addEventListener("click", function (e) {
		var editor = simpleEditor.markdowneditor;
		if (editor) {
			editor.setValue("", -1);
		}
	}, false);
	document.getElementById('save-markdown-button').addEventListener("click", function (e) {
		var editor = simpleEditor.markdowneditor;
		if (editor) {
			var txt = editor.getValue();
			var blob = new Blob([txt], { 'type': 'text/plain' });
			simpleEditor.saveasCommand(blob)
		}
	}, false);
	document.getElementById('copy-markdown-button').addEventListener("click", function (e) {
		var editor = simpleEditor.markdowneditor;
		if (editor) {
			var txt = editor.getValue();
			var inpt = document.getElementById("dammyinput");
			inpt.value = txt;
			inpt.focus();
			inpt.select();
			document.execCommand("copy");
		}
	}, false);
	document.getElementById('markdown-preview-checkbox').addEventListener("change", function (e) {
		if (this.checked) {
			document.getElementById('markdown-previewer').style.display = "block";
			document.getElementById('markdown-editor').style.right = "51%";
		} else {
			document.getElementById('markdown-previewer').style.display = "none";
			document.getElementById('markdown-editor').style.right = 0;
		}
	}, false);
	document.getElementById('save-mdHTML-button').addEventListener("click", function (e) {
		var html = document.getElementById("markdown-previewer").innerHTML;
		var blob = new Blob([html], { 'type': 'text/plain' });
		simpleEditor.saveasCommand(blob)
	}, false);
	document.getElementById('copy-mdHTML-button').addEventListener("click", function (e) {
		var editor = simpleEditor.markdowneditor;
		if (editor) {
			var html = document.getElementById("markdown-previewer").innerHTML;
			var inpt = document.getElementById("dammyinput");
			inpt.value = html;
			inpt.focus();
			inpt.select();
			document.execCommand("copy");
		}
	}, false);
	document.getElementById('createnew-button').addEventListener("click", function (e) {
		simpleEditor.createEmptyTab();
	}, true);
	var sftimerid = null;
	var sinput = document.getElementById('search-file-input');
	sinput.addEventListener("keyup", function (e) {
		var val = this.value;
		clearTimeout(sftimerid);
		sftimerid = setTimeout(function () {
			simpleEditor.searchFile(val);
		}, 500);
	}, true);
	sinput.addEventListener("mouseup", function (e) {
		var val = this.value;
		simpleEditor.searchFile(val);
	}, true);
	document.getElementById('search-file-button').addEventListener("click", function (e) {
		var val = document.getElementById('search-file-input').value.replace(/^\s+|\s+$/g, "");
		simpleEditor.searchFile(val);
	}, true);
	document.getElementById('search-finish-button').addEventListener("click", function (e) {
		simpleEditor.searchFile("");
	}, true);
	document.addEventListener('contextmenu', function (e) {
		simpleEditor.showContextMenu(e);
	}, true);
	document.addEventListener('click', function (e) {
		simpleEditor.hideContextMenu();
	}, false);
	document.getElementById('context-menu-create-file').addEventListener("click", function (e) {
		var elem = document.getElementById('newItemProjectModal');
		elem.style.display = "block";
		setTimeout(function () {
			elem.style.opacity = 1;
		}, 20);
		simpleEditor.contextmenutarget.type = "file";
		setTimeout(function () {
			document.getElementById('crate-new-project--input').focus();
		}, 50);
	}, true);
	document.getElementById('context-menu-create-folder').addEventListener("click", function (e) {
		var elem = document.getElementById('newItemProjectModal');
		elem.style.display = "block";
		setTimeout(function () {
			elem.style.opacity = 1;
		}, 20);
		simpleEditor.contextmenutarget.type = "folder";
		setTimeout(function () {
			document.getElementById('crate-new-project--input').focus();
		}, 50);
	}, true);
	document.getElementById('newItemProjectModal').addEventListener("click", function (e) {
		var that = document.getElementById('newItemProjectModal');
		that.style.opacity = 0;
		setTimeout(function () {
			that.style.display = "none";
		}, 300);
		simpleEditor.contextmenutarget = null;
	}, false);
	document.getElementById('crate-new-project--input').addEventListener("click", function (e) {
		e.stopPropagation();
	}, true);
	document.getElementById('crate-new-project--input').addEventListener("keypress", function (e) {
		if (e.keyCode === 13) document.getElementById("crate-new-project-button").click();
	}, true);
	document.getElementById('crate-new-project-button').addEventListener("click", function (e) {
		var val = document.getElementById('crate-new-project--input').value.replace(/^\s+|\s+$/g, "");
		simpleEditor.createProjecFile(val);
	}, true);
	document.getElementById('closegotoModal').addEventListener("click", function (e) {
		simpleEditor.hideGoto();
	}, true);
	document.getElementById('goto-input').addEventListener("keyup", function (e) {
		if (e.keyCode === 9) {
		} else if (e.keyCode === 13 && simpleEditor.showgoto) {
			var inpttxt = document.getElementById('goto-input').value;
			var selelem = document.getElementsByClassName("select-goto-item")[0];
			var selpelem = document.getElementsByClassName("select-command-palette-item")[0];

			if (simpleEditor.currentpanelmode === "gotoline") {
				if (/^\:[ 0-9]+/.test(inpttxt)) {
					var lines = inpttxt.split(":");
					var line = lines[1];
					if (line) {
						line = line.replace(/^\s+|\s+$/g, "");
						simpleEditor.gotosession = line - 0;
					}
				}
			}
			if (simpleEditor.currentpanelmode === "file") {
				if (!simpleEditor.gotoelem) {
					simpleEditor.openGotoItem();
				} else if (simpleEditor.gotoelem) {
					simpleEditor.openGotoItem()
				} else if (selelem) {
					simpleEditor.openGotoItem(selelem)
				}
			} else if (simpleEditor.currentpanelmode === "command") {
				var cstr = inpttxt.replace(/^\s+|\s+$/g, "");
				if (!cstr) return
				for (var i = 0; i < simpleEditor.commands.length; i++) {
					if ("/" + simpleEditor.commands[i].name === cstr) {
						var editor = simpleEditor.tabs[simpleEditor.selecttabid].editor;
						editor.focus();
						simpleEditor.hideGoto();
						simpleEditor.commands[i].exec(editor);
						break;
					}
				};
			} else if (simpleEditor.gotosession) {
				var editor = simpleEditor.tabs[simpleEditor.selecttabid].editor;
				editor.gotoLine(simpleEditor.gotosession - 0, 0, false)
				editor.focus();
				simpleEditor.hideGoto();
			}
		} else if (e.keyCode === 16) {
		} else if (e.keyCode > 36 && e.keyCode < 41) {
		} else {
			var val = this.value.replace(/^\s+|\s+$/g, "");
			clearTimeout(gototimerid)
			gototimerid = setTimeout(function () {
				simpleEditor.changeGoto(val)
			}, 450)
		}
	}, true);
	document.getElementById('goto-input').addEventListener("keydown", function (e) {
		var keycode = e.keyCode, shiftkey = e.shiftKey;
		if (keycode === 40 && simpleEditor.showgoto) {
			keycode = 9;
		} else if (e.keyCode === 38 && simpleEditor.showgoto) {
			keycode = 9;
			shiftkey = true;
		}
		if (keycode === 9 && simpleEditor.showgoto) {
			e.preventDefault();
			e.stopPropagation();
			var gitems = document.getElementsByClassName("goto-item");
			var gitem = gitems[0]
			var citems = document.getElementsByClassName("command-palette-item");
			var citem = citems[0]
			var clsname = "select-goto-item";
			var funcname = "selectGotoItem"
			var ary = gitems;
			var fstelem = gitem
			if (citem) {
				clsname = "select-command-palette-item";
				funcname = "selectCommandPalette"
				ary = citems;
				fstelem = citem;
			}
			if (gitem || citem) {
				if (shiftkey) {
					var selelem = document.getElementsByClassName(clsname)[0]
					if (selelem) {
						var pre = selelem.previousSibling;
						if (pre) {
							simpleEditor[funcname](null, pre)
						} else {
							simpleEditor[funcname](null, ary[ary.length - 1])
						}
					} else {
						simpleEditor[funcname](null, ary[ary.length - 1])
					}
				} else {
					var selelem = document.getElementsByClassName(clsname)[0]
					if (selelem) {
						var next = selelem.nextSibling;
						if (next) {
							simpleEditor[funcname](null, next)
						} else {
							simpleEditor[funcname](null, fstelem)
						}
					} else {
						simpleEditor[funcname](null, fstelem)
					}
				}
			} else {
				var inpttxt = document.getElementById('goto-input').value;
				simpleEditor.changeGoto(inpttxt, "tab", shiftkey);
			}
		}
	}, true);
	document.documentElement.addEventListener("keydown", function (e) {
		if (e.keyCode === 27 && simpleEditor.showgoto) simpleEditor.hideGoto();
	}, true)
	document.getElementById('githubURLModal').addEventListener("click", function (e) {
		var that = this;
		that.style.opacity = 0;
		setTimeout(function () {
			that.style.display = "none";
		}, 300);
		simpleEditor.gitclonemode = false;
		document.getElementsByClassName("git-reopen-label")[0].style.display = "none"
	}, false);
	document.getElementById('open-github-input').addEventListener("click", function (e) {
		e.stopPropagation();
	}, true);
	document.getElementById('open-github-input').addEventListener("keypress", function (e) {
		if (e.keyCode === 13) document.getElementById("open-github-button").click();
	}, true);
	document.getElementById('open-github-button').addEventListener("click", function (e) {
		if (simpleEditor.gitclonemode === "clone") {
			var val = document.getElementById('open-github-input').value;
			simpleEditor.gitCommand(val, "clone");
			document.getElementById("loadingModal").style.display = "block"
		} else if (simpleEditor.gitclonemode === "branch") {
			var val = document.getElementById('open-github-input').value;
			if (simpleEditor.gitinfo && simpleEditor.gitinfo.url) simpleEditor.gitCommand(simpleEditor.gitinfo.url, "branch", val);
		} else {
			var urls = document.getElementById('open-github-input').value.split("/");
			if (!urls[3] || !urls[4]) return;
			var user = urls[3];
			var rname = urls[4].split(".git")[0];
			var url = "https://github.com/" + user + "/" + rname + "/archive/master.zip";
			simpleEditor.__openGithubURL(url, rname);
		}
		simpleEditor.gitclonemode = false;
	}, true);
	document.getElementById('githubCheckoutModal').addEventListener("click", function (e) {
		this.style.display = "none";
	}, false);
	document.getElementById('select-branch').addEventListener("click", function (e) {
		e.stopPropagation();
	}, true);
	document.getElementById('select-branch').addEventListener("change", function (e) {
		var val = this.value;
		if (simpleEditor.gitinfo && simpleEditor.gitinfo.url) simpleEditor.gitCommand(simpleEditor.gitinfo.url, "checkout", val);
	}, true);
	document.getElementById('git-user-okbutton').addEventListener("click", function (e) {
		var name = document.getElementById("git-username-input").value.replace(/^\s+|\s+$/g, "")
		var pass = document.getElementById("git-userpassword-input").value.replace(/^\s+|\s+$/g, "")
		var mail = document.getElementById("git-useremail-input").value.replace(/^\s+|\s+$/g, "")
		simpleEditor.optobj.gitusername = name;
		simpleEditor.optobj.gituserpass = pass;
		simpleEditor.optobj.gitusermail = mail;
		simpleEditor.saveOptions();
		document.getElementById("gitUserModal").style.display = "none"
	}, false);
	document.getElementById('closegitModal').addEventListener("click", function (e) {
		document.getElementById("opengitModal").style.display = "none"
	}, true);
	document.getElementById('closegitCommitModal').addEventListener("click", function (e) {
		document.getElementById("githubCommitModal").style.display = "none"
	}, true);
	document.getElementById('git-commit-user-okbutton').addEventListener("click", function (e) {
		var obj = {};
		obj.name = document.getElementById('git-commit-username-input').value;
		obj.mail = document.getElementById('git-commit-useremail-input').value;
		obj.message = document.getElementById('git-commit-message-input').value;
		if (!obj.message) obj.message = "Commit"
		if (simpleEditor.gitinfo && simpleEditor.gitinfo.url) simpleEditor.gitCommand(simpleEditor.gitinfo.url, "commit", null, obj);
		document.getElementById("closegitCommitModal").click();
	}, true);
	document.getElementById('fontsize').addEventListener("change", function (e) {
		document.getElementById("fontsize-parcent").value = 100;
		simpleEditor.optobj.fontsizepcnt = 100;
	}, true);
	$("#tabul").sortable({
		axis: "x",
		tolerance: "pointer",
		revert: true,
		scroll: false,
		delay: 120,
		update: function (event, ui) {
			clearTimeout(simpleEditor.chklisttimerid)
			simpleEditor.chklisttimerid = setTimeout(function () {
				simpleEditor.checkFileList();
			}, 300)
		}
	}).disableSelection();
	$("#project-open-container").sortable({
		axis: "y",
		tolerance: "pointer",
		revert: true,
		scroll: false,
		delay: 120,
		update: function (event, ui) {
			var liarry = $('#project-open-container').sortable('toArray');
			if (liarry.length > 1) {
				var cont = document.getElementById("tabul");
				for (var i = 0; i < liarry.length; i++) {
					var tabid = liarry[i].split("open-file-item-")[1];
					var li = document.getElementById("tabliNo" + tabid);
					li = $(li).remove();
					$(cont).append(li);
				};
				$("#project-open-container").sortable("refreshPositions");
			}
		}
	}).disableSelection();
}
chrome.app.runtime.onLaunched.addListener(function (launchData) {
	if (launchData && launchData.items && launchData.items[0] && launchData.items[0].entry) {
		var aitem = launchData.items[0].entry;
		simpleEditor.checkFileEntry([aitem], null, null);
		simpleEditor.pushHistory(aitem)
		chrome.runtime.getBackgroundPage(function (bg) {
			if (bg.FILE_ENTRY_ && bg.FILE_ENTRY_.items && bg.FILE_ENTRY_.items[0]) {
				bg.FILE_ENTRY_ = null;
			}
		});
	} else {
		chrome.runtime.getBackgroundPage(function (bg) {
			var crntw = chrome.app.window.current();
			bg.launchSimpleEditor({ w: crntw.outerBounds.width, h: crntw.outerBounds.height });
		});
	}
});
