import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { convertJsonToSqlite } from '../commands';
import sqlite3 from 'sqlite3';

// Helper function to query the SQLite database  
function queryDatabase(sqliteFilePath: string, query: string) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(sqliteFilePath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                reject(err);
            }
        });

        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows);
            db.close();
        });
    });
}

function cleanup(jsonFilePath: string, sqliteFilePath: string) {
    // Clean up
    if (fs.existsSync(jsonFilePath)) {
        fs.unlinkSync(jsonFilePath);
    }
    if (fs.existsSync(sqliteFilePath)) {
        fs.unlinkSync(sqliteFilePath);
    }
}

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Single table JSON format', async () => {
        const jsonFilePath = path.join(__dirname, 'test_single_table.json');
        const sqliteFilePath = jsonFilePath.replace('.json', '.sqlite');
        const jsonData = [
            {
                "id": 1,
                "first_name": "Loella",
                "last_name": "Albers",
                "email": "lalbers0@wikipedia.org",
                "gender": "Female",
                "ip_address": "111.57.78.115"
            },
            {
                "id": 2,
                "first_name": "Laurie",
                "last_name": "Strongman",
                "email": "lstrongman1@addtoany.com",
                "gender": "Male",
                "ip_address": "158.34.146.239"
            }
        ];

        try {
            fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));

            const fileUri = vscode.Uri.file(jsonFilePath);
            await convertJsonToSqlite(fileUri);

            assert.ok(fs.existsSync(sqliteFilePath), 'SQLite file should be created');

            const rows: any = await queryDatabase(sqliteFilePath, 'SELECT * FROM test_single_table');
            assert.strictEqual(rows.length, 2, 'Table "test_single_table" should contain 2 rows');
        }
        finally {
            cleanup(jsonFilePath, sqliteFilePath);
        }
    });

    test('Named table JSON format', async () => {
        const jsonFilePath = path.join(__dirname, 'test_named_table.json');
        const sqliteFilePath = jsonFilePath.replace('.json', '.sqlite');
        const jsonData = {
            "locations": [
                {
                    "id": 0,
                    "name": "Acme Fresh Start Housing",
                    "city": "Chicago",
                    "state": "IL",
                    "photo": "https://angular.dev/assets/images/tutorials/common/bernard-hermant-CLKGGwIBTaY-unsplash.jpg",
                    "availableUnits": 4,
                    "wifi": true,
                    "laundry": true
                },
                {
                    "id": 1,
                    "name": "A113 Transitional Housing",
                    "city": "Santa Monica",
                    "state": "CA",
                    "photo": "https://angular.dev/assets/images/tutorials/common/brandon-griggs-wR11KBaB86U-unsplash.jpg",
                    "availableUnits": 0,
                    "wifi": false,
                    "laundry": true
                }
            ]
        };

        try {
            fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));

            const fileUri = vscode.Uri.file(jsonFilePath);
            await convertJsonToSqlite(fileUri);

            assert.ok(fs.existsSync(sqliteFilePath), 'SQLite file should be created');

            const rows: any = await queryDatabase(sqliteFilePath, 'SELECT * FROM locations');
            assert.strictEqual(rows.length, 2, 'Table "locations" should contain 2 rows');
        }
        finally {
            cleanup(jsonFilePath, sqliteFilePath);
        }
    });

    test('Multiple tables JSON format', async () => {
        const jsonFilePath = path.join(__dirname, 'test_multiple_tables.json');
        const sqliteFilePath = jsonFilePath.replace('.json', '.sqlite');
        const jsonData = [
            {
                "table1": [
                    {
                        "id": 0,
                        "name": "Acme Fresh Start Housing",
                        "city": "Chicago",
                        "state": "IL",
                        "photo": "https://angular.dev/assets/images/tutorials/common/bernard-hermant-CLKGGwIBTaY-unsplash.jpg",
                        "availableUnits": 4,
                        "wifi": true,
                        "laundry": true
                    },
                    {
                        "id": 1,
                        "name": "A113 Transitional Housing",
                        "city": "Santa Monica",
                        "state": "CA",
                        "photo": "https://angular.dev/assets/images/tutorials/common/brandon-griggs-wR11KBaB86U-unsplash.jpg",
                        "availableUnits": 0,
                        "wifi": false,
                        "laundry": true
                    }
                ]
            },
            {
                "table2": [
                    {
                        "id": 0,
                        "name": "Acme Fresh Start Housing",
                        "city": "Chicago",
                        "state": "IL",
                        "photo": "https://angular.dev/assets/images/tutorials/common/bernard-hermant-CLKGGwIBTaY-unsplash.jpg",
                        "availableUnits": 4,
                        "wifi": true,
                        "laundry": true
                    },
                    {
                        "id": 1,
                        "name": "A113 Transitional Housing",
                        "city": "Santa Monica",
                        "state": "CA",
                        "photo": "https://angular.dev/assets/images/tutorials/common/brandon-griggs-wR11KBaB86U-unsplash.jpg",
                        "availableUnits": 0,
                        "wifi": false,
                        "laundry": true
                    }
                ]
            }
        ];

        try {
            fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));

            const fileUri = vscode.Uri.file(jsonFilePath);
            await convertJsonToSqlite(fileUri);

            assert.ok(fs.existsSync(sqliteFilePath), 'SQLite file should be created');

            const rowsTable1: any = await queryDatabase(sqliteFilePath, 'SELECT * FROM table1');
            assert.strictEqual(rowsTable1.length, 2, 'Table "table1" should contain 2 rows');

            const rowsTable2: any = await queryDatabase(sqliteFilePath, 'SELECT * FROM table2');
            assert.strictEqual(rowsTable2.length, 2, 'Table "table2" should contain 2 rows');
        }
        finally {
            cleanup(jsonFilePath, sqliteFilePath);
        }
    });

    test('GUIDs are stored in uppercase', async () => {
        const jsonFilePath = path.join(__dirname, 'test_guids.json');
        const sqliteFilePath = jsonFilePath.replace('.json', '.sqlite');
        const jsonData = [
            {
                "id": 1,
                "guid": "123e4567-e89b-12d3-a456-426614174000"
            },
            {
                "id": 2,
                "guid": "123e4567-e89b-12d3-a456-426614174001"
            }
        ];

        try {
            fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));

            const fileUri = vscode.Uri.file(jsonFilePath);
            await convertJsonToSqlite(fileUri);

            assert.ok(fs.existsSync(sqliteFilePath), 'SQLite file should be created');

            const rows: any = await queryDatabase(sqliteFilePath, 'SELECT * FROM test_guids');
            assert.strictEqual(rows.length, 2, 'Table "test_guids" should contain 2 rows');
            assert.strictEqual(rows[0].guid, '123E4567-E89B-12D3-A456-426614174000', 'GUID should be stored in uppercase');
            assert.strictEqual(rows[1].guid, '123E4567-E89B-12D3-A456-426614174001', 'GUID should be stored in uppercase');
        }
        finally {
            cleanup(jsonFilePath, sqliteFilePath);
        }
    });
});
