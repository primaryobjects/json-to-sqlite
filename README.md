# json-to-sqlite

Convert a JSON file to an SQLite database right from VSCode!

[Install](https://marketplace.visualstudio.com/items?itemName=primaryobjects.json-to-sqlite) in VSCode.

![Screenshot](images/jsontosqlite.gif)

## Quick Start

1. Open your VSCode project.
2. Right-click a JSON file such as `example.json`.
3. Select the context menu **Convert JSON to SQLite**.
4. A new file `example.sqlite` will be saved in the same directory. The database table name is the same as the filename **example**.

To preview an SQLite file contents:

1. Right-click a SQLite file such as `example.sqlite`.
2. Select the context menu **Preview SQLite File**.
3. A message will display showing the top 3 records in the database.

## Settings

To change the name of the table saved in the sqlite file, use the following steps.

1. In VSCode, select **File->Preferences->Settings**.
2. Search for **json-to-sqlite**.
3. Enter a value for **Custom Table Name**.
4. Uncheck the option **Use Filename As Table Name.**

## Features

- Convert any JSON file to SQLite.
- Right-click a JSON file or use the command pallete **Ctrl-Shift-P->Convert JSON to SQLite** and choose a file.
- Preview SQLite file contents.
- Customize the table name stored in sqlite.

## License

MIT

## Author

Kory Becker http://www.primaryobjects.com/kory-becker