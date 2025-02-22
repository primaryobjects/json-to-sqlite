import * as vscode from 'vscode';
import fs from 'fs';
const sqlite3 = require('sqlite3').verbose();

export async function convertJsonToSqlite(fileUri: vscode.Uri | undefined) {
    // If filePath is not provided, prompt the user to select a JSON file.
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
            // Create an sqlite database in a file in the current directory using the same filename as input.
            const db = new sqlite3.Database(`${jsonFile}.sqlite`);

            db.serialize(() => {
                db.run(`CREATE TABLE data (id INTEGER PRIMARY KEY, content TEXT)`);

                const stmt = db.prepare('INSERT INTO data (content) VALUES (?)');
                jsonData.forEach((item: object, index: number) => {
                    stmt.run(JSON.stringify(item));
                });
                stmt.finalize();

                db.each('SELECT * FROM data', (err: any, row: string) => {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log(row);
                    }
                });
            });

            db.close();
            // Display the path to the sqlite file in a message box.
            vscode.window.showInformationMessage(`SQLite file created at ${jsonFile}.sqlite`);
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
