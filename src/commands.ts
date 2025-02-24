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
            if (!jsonData || (Array.isArray(jsonData) && jsonData.length === 0)) {
                vscode.window.showErrorMessage('JSON file is empty or not valid');
                return;
            }

            const filePath = jsonFile.split('.').slice(0, -1).join('.');
            const fileName = path.basename(jsonFile, path.extname(jsonFile));
            const useFilenameAsTableName = vscode.workspace.getConfiguration('jsonToSqlite').get('useFilenameAsTableName', true);
            const customTableName = vscode.workspace.getConfiguration('jsonToSqlite').get('customTableName', '');

            const db = new sqlite3.Database(`${filePath}.sqlite`);

            db.serialize(() => {
                if (Array.isArray(jsonData) && jsonData.length > 0 && typeof jsonData[0] === 'object') {
                        if (!Array.isArray(jsonData[0])) {
                            const jsonDataEntry = jsonData[0];
                            const keys = Object.keys(jsonData[0]);
                            if (keys && keys.length > 0) {
                                if (Array.isArray(jsonDataEntry[keys[0]])) {
                                    // Format 3: Multiple tables [ { "table1": [], {"table2": []}}]
                                    jsonData.forEach((tableData: any) => {
                                        const tableName = Object.keys(tableData)[0];
                                        createTableAndInsertData(db, tableName, tableData[tableName]);
                                    });
                                }
                                else {
                                    // Format 1: Single table [{ ... }]
                                    const tableName = useFilenameAsTableName ? fileName : customTableName || 'data';
                                    createTableAndInsertData(db, tableName, jsonData);
                                }
                            }
                        }
                } else if (typeof jsonData === 'object') {
                    // Format 2: Multiple tables { "table": [] }
                    const tableNames = Object.keys(jsonData);
                    tableNames.forEach(tableName => {
                        createTableAndInsertData(db, tableName, jsonData[tableName]);
                    });
                }
            });

            db.close();
            vscode.window.showInformationMessage(`SQLite file created at ${filePath}.sqlite`);
        });
    }
}

function createTableAndInsertData(db: any, tableName: string, data: any[]) {
    const columns = Object.keys(data[0]).map(key => `${key} ${getColumnType(data[0][key])}`).join(', ');
    db.run(`CREATE TABLE ${tableName} (${columns})`);

    const placeholders = Object.keys(data[0]).map(() => '?').join(', ');
    const stmt = db.prepare(`INSERT INTO ${tableName} (${Object.keys(data[0]).join(', ')}) VALUES (${placeholders})`);

    data.forEach((item: any) => {
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
