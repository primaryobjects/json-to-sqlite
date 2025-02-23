import * as vscode from 'vscode';
import fs from 'fs';
import * as path from 'path';
const sqlite3 = require('sqlite3').verbose();

function getColumnType(value: any): string {
    if (typeof value === 'number') {
        return Number.isInteger(value) ? 'INTEGER' : 'REAL';
    }
    return 'TEXT';
}

export async function convertJsonToSqlite(fileUri: vscode.Uri | undefined) {
    if (!fileUri) {
        fileUri = (await vscode.window.showOpenDialog({ canSelectFiles: true, canSelectMany: false, filters: { 'JSON Files': ['json'] } }))?.[0];
    }

    if (fileUri) {
        const jsonFile = fileUri.fsPath;
        fs.readFile(jsonFile, 'utf8', (err, data) => {
            if (err) {
                vscode.window.showErrorMessage('Failed to read file');
                return;
            }

            const jsonData = JSON.parse(data);
            if (!Array.isArray(jsonData) || jsonData.length === 0) {
                vscode.window.showErrorMessage('JSON file is empty or not an array');
                return;
            }

            const filePath = jsonFile.split('.').slice(0, -1).join('.');
            const fileName = path.basename(jsonFile, path.extname(jsonFile));
            const useFilenameAsTableName = vscode.workspace.getConfiguration('jsonToSqlite').get('useFilenameAsTableName', true);
            const customTableName = vscode.workspace.getConfiguration('jsonToSqlite').get('customTableName', '');
            const tableName = useFilenameAsTableName ? fileName : customTableName || 'data';

            const db = new sqlite3.Database(`${filePath}.sqlite`);

            db.serialize(() => {
                // Get the keys from the first object to create table columns with appropriate data types
                const columns = Object.keys(jsonData[0]).map(key => `${key} ${getColumnType(jsonData[0][key])}`).join(', ');
                db.run(`CREATE TABLE ${tableName} (${columns})`);

                const placeholders = Object.keys(jsonData[0]).map(() => '?').join(', ');
                const stmt = db.prepare(`INSERT INTO ${tableName} (${Object.keys(jsonData[0]).join(', ')}) VALUES (${placeholders})`);

                jsonData.forEach((item: any) => {
                    const values = Object.keys(item).map(key => item[key]);
                    stmt.run(values);
                });
                stmt.finalize();

                db.each(`SELECT * FROM ${tableName}`, (err: any, row: any) => {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log(row);
                    }
                });
            });

            db.close();
            vscode.window.showInformationMessage(`SQLite file created at ${filePath}.sqlite`);
        });
    }
}

export async function previewSqlite(uri: vscode.Uri) {
    const db = new sqlite3.Database(uri.fsPath);
    db.all("SELECT * FROM sqlite_master WHERE type='table'", (err: any, tables: any) => {
        if (err) {
            vscode.window.showErrorMessage(`Error reading SQLite file: ${err.message}`);
            return;
        }
        if (tables.length === 0) {
            vscode.window.showInformationMessage('No tables found in the SQLite database.');
            return;
        }
        const tableName = tables[0].name;
        db.all(`SELECT * FROM ${tableName} LIMIT 3`, (err: any, rows: any) => {
            if (err) {
                vscode.window.showErrorMessage(`Error reading table data: ${err.message}`);
                return;
            }
            vscode.window.showInformationMessage(`First 3 rows of ${tableName}: ${JSON.stringify(rows, null, 2)}`);
        });
    });
    db.close();
}
