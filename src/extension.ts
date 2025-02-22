import * as vscode from 'vscode';
import { convertJsonToSqlite, previewSqlite } from './commands';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('json-to-sqlite.convertJsonToSqlite', convertJsonToSqlite);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('json-to-sqlite.convertJsonToSqliteChooseFile', convertJsonToSqlite);
    context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('json-to-sqlite.previewSqliteContents', previewSqlite);
	context.subscriptions.push(disposable);
}

export function deactivate() {}