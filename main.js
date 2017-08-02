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
		var table;
		var tbody;
		var row1 = false;
		var col1 = true;
		var tr;
		clipboard = $(oldData);
		//console.log(clipboard);
		[].forEach.call(clipboard, function (elm) {
			if (elm.nodeName === "TABLE") {
				table = elm;
			}
		});
		table = $(table)[0].children;
		//console.log(table);
		[].forEach.call(table, function (elm) {
			if (elm.nodeName === "TBODY") {
				tbody = elm;
			}
		});
		tr = tbody.children;
		if (tr.length === 1) { //1行かどうか
			row1 = true;
			//console.log("1行!");
		}
		[].forEach.call(tr, function (elm) {
			if (elm.children.length !== 1) { //全行が1列かどうか
				col1 = false;
			}
		});
		if (col1) {
			//console.log("1列!");
		}

		if (row1 || col1) {
			//console.log("1行または1列なので、何もしない!");
			if (row1 && col1) {
				noIndention(tbody.children[0].children[0].textContent);
			}
			return;
		}
		table = tbody.innerHTML;
		table = table.replace(/<!--(.*?)-->\n/g, "");
		table = table.replace(/ (width|height|style|class)="(.*?)"/g, "");
		table = table.replace(/<br>\n/gm, "<br>");
		table = table.replace(/<br>(\s*)/g, "<br>");
		table = '<table class="xxx">\n<tbody>\n' + table + '</tbody>\n</table>';
		codeMirror.replaceRange(table, _change_from, _from);
		reindent(codeMirror, _change_from.line, _change_from.line * 1 + table.match(/\n/mig).length + 1);
	}

	function noIndention(moji) {
		//console.log("noIndention");
		codeMirror.replaceRange(moji, _change_from, _from);
		reindent(codeMirror, _change_from.line, _change_from.line * 1 + moji.match(/\n/mig).length + 1);
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
			if (oldData) {
				//alert("htmlと認識された！");
				var currentDoc = DocumentManager.getCurrentDocument();
				currentDoc.batchOperation(function () {
					table_maker(oldData);
				});
			}
		});
	}

	AppInit.appReady(function () {
		init();
	});
});