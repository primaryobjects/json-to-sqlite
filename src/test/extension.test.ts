import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { convertJsonToSqlite } from '../commands';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Single table JSON format', async () => {
        const jsonFilePath = path.join(__dirname, 'test_single_table.json');
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
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));

        const fileUri = vscode.Uri.file(jsonFilePath);
        await convertJsonToSqlite(fileUri);

        const sqliteFilePath = jsonFilePath.replace('.json', '.sqlite');
        assert.ok(fs.existsSync(sqliteFilePath), 'SQLite file should be created');

        // Clean up
        fs.unlinkSync(jsonFilePath);
        fs.unlinkSync(sqliteFilePath);
    });

    test('Named table JSON format', async () => {
        const jsonFilePath = path.join(__dirname, 'test_named_table.json');
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
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));

        const fileUri = vscode.Uri.file(jsonFilePath);
        await convertJsonToSqlite(fileUri);

        const sqliteFilePath = jsonFilePath.replace('.json', '.sqlite');
        assert.ok(fs.existsSync(sqliteFilePath), 'SQLite file should be created');

        // Clean up
        fs.unlinkSync(jsonFilePath);
        fs.unlinkSync(sqliteFilePath);
    });

    test('Multiple tables JSON format', async () => {
        const jsonFilePath = path.join(__dirname, 'test_multiple_tables.json');
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
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));

        const fileUri = vscode.Uri.file(jsonFilePath);
        await convertJsonToSqlite(fileUri);

        const sqliteFilePath = jsonFilePath.replace('.json', '.sqlite');
        assert.ok(fs.existsSync(sqliteFilePath), 'SQLite file should be created');

        // Clean up
        fs.unlinkSync(jsonFilePath);
        fs.unlinkSync(sqliteFilePath);
    });
});
