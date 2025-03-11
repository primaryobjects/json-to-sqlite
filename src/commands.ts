
import { promises as fs } from 'fs'; // Use the fs promises API for async file operations    
import * as path from 'path';
import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';
import * as vscode from 'vscode';

// Determine the SQLite column type based on the JavaScript value type  
function getColumnType(value: any): string {
    if (['number', 'boolean'].includes(typeof value)) {
        return Number.isInteger(value) || (typeof value === 'boolean') ? 'INTEGER' : 'REAL';
    }
    return 'TEXT';
}

// Helper function to convert GUIDs to uppercase
function convertGuidsToUpperCase(data: any[]): any[] {
    return data.map(item => {
        const newItem: any = {};
        for (const key in item) {
            if (item.hasOwnProperty(key)) {
                const value = item[key];
                if (typeof value === 'string' && /^[0-9a-fA-F-]{36}$/.test(value)) {
                    newItem[key] = value.toUpperCase();
                } else {
                    newItem[key] = value;
                }
            }
        }
        return newItem;
    });
}

// Main function to convert JSON to SQLite  
export async function convertJsonToSqlite(fileUri: vscode.Uri | undefined) {
    // Prompt user to select a file if not provided  
    if (!fileUri) {
        fileUri = (await vscode.window.showOpenDialog({ canSelectFiles: true, canSelectMany: false, filters: { 'JSON Files': ['json'] } }))?.[0];
    }

    if (fileUri) {
        try {
            // Read and parse the JSON file  
            const jsonFile = fileUri.fsPath;
            const data = await fs.readFile(jsonFile, 'utf8');
            const jsonData = JSON.parse(data);

            // Handle empty or invalid JSON  
            if (!jsonData || (Array.isArray(jsonData) && jsonData.length === 0)) {
                vscode.window.showErrorMessage('JSON file is empty or not valid');
                return;
            }

            // Prepare the database file path  
            const filePath = jsonFile.split('.').slice(0, -1).join('.');
            // Open the SQLite database  
            const db = await open({
                filename: `${filePath}.sqlite`,
                driver: sqlite3.Database
            });

            // Process the JSON data into the SQLite database  
            if (Array.isArray(jsonData) && jsonData.length > 0 && typeof jsonData[0] === 'object') {
                if (!Array.isArray(jsonData[0])) {
                    const jsonDataEntry = jsonData[0];
                    const keys = Object.keys(jsonData[0]);
                    if (keys && keys.length > 0) {
                        if (Array.isArray(jsonDataEntry[keys[0]])) {
                            await handleMultipleTablesFormat(db, jsonData);
                        } else {
                            // Use file name as table name by default  
                            const fileName = path.basename(jsonFile, path.extname(jsonFile));
                            const useFilenameAsTableName = vscode.workspace.getConfiguration('jsonToSqlite').get('useFilenameAsTableName', true);
                            const customTableName = vscode.workspace.getConfiguration('jsonToSqlite').get('customTableName', '');
                            await handleSingleTableFormat(db, jsonData, fileName, useFilenameAsTableName, customTableName);
                        }
                    }
                }
            } else if (typeof jsonData === 'object') {
                await handleNamedTableFormat(db, jsonData);
            }

            // Close the database connection  
            await db.close();
            vscode.window.showInformationMessage(`SQLite file created at ${filePath}.sqlite`);
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to process JSON to SQLite conversion. ${err}`);
            console.error(err);
        }
    }
}

async function handleSingleTableFormat(db: Database<sqlite3.Database, sqlite3.Statement>, jsonData: any[], fileName: string, useFilenameAsTableName: boolean, customTableName: string) {
    // [{"field1": "a", "field2": "b"}]
    const tableName = useFilenameAsTableName ? fileName : customTableName || 'data';
    await createTableAndInsertData(db, tableName, jsonData);
}

async function handleNamedTableFormat(db: Database<sqlite3.Database, sqlite3.Statement>, jsonData: any) {
    // { "table1": [{"field1": "a", "field2": "b"}], "table2": [{"field1": "a", "field2": "b"}] }
    for (const tableName in jsonData) {
        // Check if the property belongs to the object itself, not its prototype chain  
        if (jsonData.hasOwnProperty(tableName)) {
            await createTableAndInsertData(db, tableName, jsonData[tableName]);
        }
    }
}

async function handleMultipleTablesFormat(db: Database<sqlite3.Database, sqlite3.Statement>, jsonData: any[]) {
    // [ { "table1": [{"field1": "a", "field2": "b"}] }, { "table2": [{"field1": "c", "field2": "d"}, {"field1": "e", "field2": "f"}] } ]
    for (const tableData of jsonData) {
        const tableName = Object.keys(tableData)[0]; // Get table name from object key  
        await createTableAndInsertData(db, tableName, tableData[tableName]);
    }
}

// Create a table and insert data into it  
async function createTableAndInsertData(db: Database<sqlite3.Database, sqlite3.Statement>, tableName: string, data: any[]) {
    if (data.length) { // Ensure there is data to process  
        // Convert GUIDs to uppercase
        data = convertGuidsToUpperCase(data);

        // Construct the CREATE TABLE command with appropriate column types  
        const columns = Object.keys(data[0]).map(key => `${key} ${getColumnType(data[0][key])}`).join(', ');
        await db.run(`CREATE TABLE IF NOT EXISTS ${tableName} (${columns})`);

        // Prepare and execute the INSERT INTO command for each data item  
        const insertCommand = `INSERT INTO ${tableName} (${Object.keys(data[0]).join(', ')}) VALUES (${Object.keys(data[0]).map(() => '?').join(', ')})`;
        for (const item of data) {
            await db.run(insertCommand, Object.values(item));
        }
    }
}

// Preview the first 3 rows of the first table in the SQLite database  
export async function previewSqlite(uri: vscode.Uri) {
    try {
        // Open the database  
        const db = await open({
            filename: uri.fsPath,
            driver: sqlite3.Database
        });

        // Retrieve all table names  
        const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
        if (tables.length === 0) {
            vscode.window.showInformationMessage('No tables found in the SQLite database.');
            return;
        }

        // Preview the first 3 rows from the first table  
        const tableName = tables[0].name;
        const rows = await db.all(`SELECT * FROM ${tableName} LIMIT 3`);
        vscode.window.showInformationMessage(`First 3 rows of ${tableName}: ${JSON.stringify(rows, null, 2)}`);

        // Close the database connection  
        await db.close();
    } catch (err: any) {
        vscode.window.showErrorMessage(`Error reading SQLite file: ${err.message}`);
    }
}    
