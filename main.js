define(function (/* require, exports, module */) {
	"use strict";
	var EditorManager = brackets.getModule('editor/EditorManager'),
		DocumentManager = brackets.getModule("document/DocumentManager"),
		MainViewManager = brackets.getModule('view/MainViewManager'),
		editor,
		codeMirror,
		running = false;


	function isFileExt(ext) {
		var fileType = DocumentManager.getCurrentDocument().getLanguage()._id;
		if (fileType.match(new RegExp(ext, "i"))){
			return fileType.toLowerCase();
		}
		return false;
	}

	function reindent(codeMirror, from, to) {
		codeMirror.operation(function () {
			codeMirror.eachLine(from, to, function (line) {
				codeMirror.indentLine(line.lineNo(), "smart");
			});
		});
	}

	function arrayToText(text) {
		var all = "";
		for (var i = 0, l = text.length; i < l; i++) {
			all = all + text[i];
		}
		return all;
	}


	function table_maker(text){
		return "ほげげ\n" + text;
	}

	MainViewManager.on("currentFileChange", function () {
		editor = EditorManager.getCurrentFullEditor();
		if (!editor) {
			return;
		}
		codeMirror = editor._codeMirror;
		codeMirror.on("change", function (codeMirror, change) {
			if (change.origin !== "paste" || change.origin != "paste" || running || !change.text[0].match(/[<>]/mig)) {
				return;
			}

			var	text = change.text,
				from = codeMirror.getCursor(true),
				to = codeMirror.getCursor(false),
				line = codeMirror.getLine(from.line);

			running = true;
			// at least 80ms until the next run.
			setTimeout(function () {
				running = false;
			}, 80);

			text = arrayToText(text);

			if (!text.length) {
				return;
			}
			text = table_maker(text);
			codeMirror.replaceRange(text, change.from, from);
			reindent(codeMirror, change.from.line, change.from.line * 1 + text.match(/\n/mig).length + 1);

		});
	});
});



function faaaaaaa() {
	"use strict";

	var DocumentManager = brackets.getModule("document/DocumentManager"),
		EditorManager = brackets.getModule("editor/EditorManager"),
		AppInit = brackets.getModule("utils/AppInit");

	var regExp = new RegExp("(\r?\n)$");
	var regExpG = new RegExp("(\r?\n)$", "g");

	function init() {
		document.addEventListener('paste', function (e) {
			var oldData = e.clipboardData.getData("text/html");
			if (/^<html xmlns/.test(oldData)) {
				main(oldData);
			}
		});
	}

	function main(oldData) {
		var currentDoc = DocumentManager.getCurrentDocument();
		var editor = EditorManager.getCurrentFullEditor();
		var selection = editor.getSelections()[0];
		var $newData = $(oldData);
		var table;
		var tbody;
		[].forEach.call($newData, function (elm) {
			if (elm.nodeName === "TABLE") {
				table = elm;
			}
		});
		table = $(table)[0].children;
		console.log(table);
		[].forEach.call(table, function (elm) {
			if (elm.nodeName === "TBODY") {
				tbody = elm;
			}
		});
		table = "<table><tbody>" + tbody.innerHTML + "</tbody></table>";
		table = table.replace("<!--EndFragment-->\n", "");
		table = table.replace(/ (width|height|style|class)="(.*?)"/g, "");
		table = table.replace(/<br> /g, "<br>");
		editor.document.replaceRange(table, selection.start, selection.end);
	}

}