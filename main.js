define(function ( /* require, exports, module */ ) {
	"use strict";
	var EditorManager = brackets.getModule('editor/EditorManager'),
		DocumentManager = brackets.getModule("document/DocumentManager"),
		MainViewManager = brackets.getModule('view/MainViewManager'),
		AppInit = brackets.getModule("utils/AppInit"),
		editor,
		codeMirror,
		clipboard,
		running = false;

	var _change_from,
		_from;

	function reindent(codeMirror, from, to) {
		codeMirror.operation(function () {
			codeMirror.eachLine(from, to, function (line) {
				codeMirror.indentLine(line.lineNo(), "smart");
			});
		});
	}

	function table_maker(oldData) {
		//console.log(oldData);
		var table;
		var tbody;
		var row1 = false;
		var col1 = true;
		var tr;
		var td;
		var all_elm;
		var attrArr = ["width", "height", "style", "class", "data-sheets-value", "data-sheets-numberformat", "data-sheets-formula", "data-sheets-note"];
		clipboard = $(oldData);
		if(!clipboard.filter("style").length){
			return;
		}
		//console.log(clipboard);
		[].forEach.call(clipboard, function (elm) {
			if (elm.nodeName === "TABLE") {
				table = elm;
			}
		});
		tbody = table.querySelector("tbody");
		tr = tbody.children;
		all_elm = tbody.querySelectorAll("*");
		td = tbody.querySelectorAll("td");

		if (tr.length === 1) { //1行かどうか
			row1 = true;
			//console.log("1行!");
		}
		[].forEach.call(tr, function (elm) {
			if (elm.children.length > 1) { //全行が1列以下かどうか
				col1 = false;
			}
		});

		[].forEach.call(all_elm, function (elm) { //余分な属性を削除
			attrArr.forEach(function (attr) {
				elm.removeAttribute(attr);
			});
		});


		if (col1) {
			//console.log("1列!");
		}

		if (row1 || col1) {
			//console.log("1行または1列なので、何もしない!");
			//console.log(td);
			if (td.length === 1) { //1セルのみなら改行取っ太郎。
				noIndention(tbody.children[0].children[0].textContent);
			}
			return;
		}

		//[th]が付いてたらthに差し替え。
		[].forEach.call(td, function (elm) {
			if (/^\[th\]/.test(elm.innerHTML)) {
				var th = document.createElement("th");
				th.innerHTML = elm.innerHTML.replace(/^\[th\]/, "");
				if(elm.getAttribute("colspan")){
					th.setAttribute("colspan", elm.getAttribute("colspan"));
				}
				if(elm.getAttribute("rowspan")){
					th.setAttribute("rowspan", elm.getAttribute("rowspan"));
				}
				elm.parentNode.insertBefore(th, elm);
				elm.parentNode.removeChild(elm);
			}
		});

		table = tbody.innerHTML;
		table = table.replace(/<!--(.*?)-->\n/g, "");
		table = table.replace(/<br>\n/gm, "<br>");
		table = table.replace(/<br>(\s*)/g, "<br>");
		table = '<table class="xxx">\n<tbody>\n' + table + '</tbody>\n</table>';
		codeMirror.replaceRange(table, _change_from, _from);
		reindent(codeMirror, _change_from.line, _change_from.line * 1 + table.match(/\n/mig).length + 1);
	}

	function noIndention(moji) {
		//console.log("noIndention");
		codeMirror.replaceRange(moji, _change_from, _from);
	}

	MainViewManager.on("currentFileChange", function () {
		editor = EditorManager.getCurrentFullEditor();
		if (!editor) {
			return;
		}
		codeMirror = editor._codeMirror;
		codeMirror.on("change", function (codeMirror, change) {
			//console.log(change);
			//console.log("change!");
			if (change.origin !== "paste" || change.origin != "paste" || running) {
				return;
			}

			var from = codeMirror.getCursor(true);

			running = true;
			// at least 80ms until the next run.
			setTimeout(function () {
				running = false;
			}, 80);

			_change_from = change.from;
			_from = from;
		});
	});

	function init() {
		document.addEventListener('paste', function (e) {
			//console.log("paste!");
			var oldData = e.clipboardData.getData("text/html");
			var oldTxtData = e.clipboardData.getData("text");
			var regExp = new RegExp("(\r?\n)$");
			if (oldData) {
				//alert("htmlと認識された！");
				var currentDoc = DocumentManager.getCurrentDocument();
				currentDoc.batchOperation(function () {
					table_maker(oldData);
				});
			}else{
				//alert("oldNoIndention");
				if(regExp.test(oldTxtData)){
					//console.log("改行あり！");
					oldNoIndention(oldTxtData);
				}
			}
		});
	}

	function oldNoIndention(oldTxtData) {
		var regExpG = new RegExp("(\r?\n)$", "g");
		var currentDoc = DocumentManager.getCurrentDocument();
		var editor = EditorManager.getCurrentFullEditor();
		var selections = editor.getSelections();
		var brs = oldTxtData.match(regExpG).length;
		var lines = brs + 1;
		var mode = editor.getModeForSelection();
		var cssLikeModeRegExp = /^(text\/x-less|text\/x-scss|css)$/;
		//alert(mode);
		if(mode !== "html"){
			//alert("htmlじゃないから改行取るのはやめよう");
			return;
		}
		if(brs > 1 && lines === selections.length){
			return;
		}
		currentDoc.batchOperation(function(){
			selections.forEach(function(sel, i) {
				var newSelections = editor.getSelections();
				var selEnd = newSelections[i].end;
				selEnd.line = selEnd.line - 1;
				selEnd.ch = 1000;
				editor.document.replaceRange("", newSelections[i].start, selEnd);
			});
		});
	}

	AppInit.appReady(function () {
		init();
	});
});