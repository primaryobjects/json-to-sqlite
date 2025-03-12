import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import sqlite3 from 'sqlite3';
import * as vscode from 'vscode';
import { convertJsonToSqlite } from '../commands';

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

    test('Non-GUID strings are stored in original casing', async () => {
        const jsonFilePath = path.join(__dirname, 'test_non_guids.json');
        const sqliteFilePath = jsonFilePath.replace('.json', '.sqlite');
        const jsonData = [
            {
                "id": 1,
                "name": "John Doe",
                "description": "This is a Test String"
            },
            {
                "id": 2,
                "name": "Jane Smith",
                "description": "Another Test String"
            }
        ];

        try {
            fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));

            const fileUri = vscode.Uri.file(jsonFilePath);
            await convertJsonToSqlite(fileUri);

            assert.ok(fs.existsSync(sqliteFilePath), 'SQLite file should be created');

            const rows: any = await queryDatabase(sqliteFilePath, 'SELECT * FROM test_non_guids');
            assert.strictEqual(rows.length, 2, 'Table "test_non_guids" should contain 2 rows');
            assert.strictEqual(rows[0].name, 'John Doe', 'Name should be stored in original casing');
            assert.strictEqual(rows[0].description, 'This is a Test String', 'Description should be stored in original casing');
            assert.strictEqual(rows[1].name, 'Jane Smith', 'Name should be stored in original casing');
            assert.strictEqual(rows[1].description, 'Another Test String', 'Description should be stored in original casing');
        }
        finally {
            cleanup(jsonFilePath, sqliteFilePath);
        }
    });

    test('Booleans are stored as INTEGER columns with correct values', async () => {
        const jsonFilePath = path.join(__dirname, 'test_booleans.json');
        const sqliteFilePath = jsonFilePath.replace('.json', '.sqlite');
        const jsonData = [
            {
                "id": 1,
                "is_active": true,
                "has_access": false
            },
            {
                "id": 2,
                "is_active": false,
                "has_access": true
            }
        ];

        try {
            fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));

            const fileUri = vscode.Uri.file(jsonFilePath);
            await convertJsonToSqlite(fileUri);

            assert.ok(fs.existsSync(sqliteFilePath), 'SQLite file should be created');

            const rows: any = await queryDatabase(sqliteFilePath, 'SELECT * FROM test_booleans');
            assert.strictEqual(rows.length, 2, 'Table "test_booleans" should contain 2 rows');
            assert.strictEqual(rows[0].is_active, 1, 'Boolean true should be stored as 1');
            assert.strictEqual(rows[0].has_access, 0, 'Boolean false should be stored as 0');
            assert.strictEqual(rows[1].is_active, 0, 'Boolean false should be stored as 0');
            assert.strictEqual(rows[1].has_access, 1, 'Boolean true should be stored as 1');

            const schema: any = await queryDatabase(sqliteFilePath, "PRAGMA table_info(test_booleans)");
            const isActiveColumn = schema.find((column: any) => column.name === 'is_active');
            const hasAccessColumn = schema.find((column: any) => column.name === 'has_access');

            assert.strictEqual(isActiveColumn.type, 'INTEGER', 'Column "is_active" should be of type INTEGER');
            assert.strictEqual(hasAccessColumn.type, 'INTEGER', 'Column "has_access" should be of type INTEGER');
        }
        finally {
            cleanup(jsonFilePath, sqliteFilePath);
        }
    });

    test('Float values are stored as REAL and integer values are stored as INTEGER', async () => {
        const jsonFilePath = path.join(__dirname, 'test_floats_and_integers.json');
        const sqliteFilePath = jsonFilePath.replace('.json', '.sqlite');
        const jsonData = [
            {
                "id": 1,
                "float_value": 123.456,
                "integer_value": 42
            },
            {
                "id": 2,
                "float_value": 789.012,
                "integer_value": 100
            }
        ];

        try {
            fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));

            const fileUri = vscode.Uri.file(jsonFilePath);
            await convertJsonToSqlite(fileUri);

            assert.ok(fs.existsSync(sqliteFilePath), 'SQLite file should be created');

            const rows: any = await queryDatabase(sqliteFilePath, 'SELECT * FROM test_floats_and_integers');
            assert.strictEqual(rows.length, 2, 'Table "test_floats_and_integers" should contain 2 rows');
            assert.strictEqual(rows[0].float_value, 123.456, 'Float value should be stored as REAL');
            assert.strictEqual(rows[0].integer_value, 42, 'Integer value should be stored as INTEGER');
            assert.strictEqual(rows[1].float_value, 789.012, 'Float value should be stored as REAL');
            assert.strictEqual(rows[1].integer_value, 100, 'Integer value should be stored as INTEGER');

            const schema: any = await queryDatabase(sqliteFilePath, "PRAGMA table_info(test_floats_and_integers)");
            const floatColumn = schema.find((column: any) => column.name === 'float_value');
            const integerColumn = schema.find((column: any) => column.name === 'integer_value');

            assert.strictEqual(floatColumn.type, 'REAL', 'Column "float_value" should be of type REAL');
            assert.strictEqual(integerColumn.type, 'INTEGER', 'Column "integer_value" should be of type INTEGER');
        }
        finally {
            cleanup(jsonFilePath, sqliteFilePath);
        }
    });
});
