# Mock Data Seeder Script

This script is designed for seeding databases with mock data for development
and testing purposes. It provides functionality to create mock users, artists,
albums, and songs in the database.

## Usage

1. Database Preparation: Before executing the commands, it's essential to clear
   the database to prevent duplicate data. The script currently does not handle
   this automatically.
2. Install Dependencies: Begin by installing dependencies with `npm install`.
3. Start the Server: Launch the server by running `npm run dev`.
4. Seed Data: Execute the script with the appropriate command line arguments to
   seed the desired data type(s). Maintain the following sequence for command
   execution: start with users, followed by artists, then albums, and finally
   songs. This ensures data integrity throughout the process.

## Commands

- To create mock users:

```sh
node ./mock-data/seed-mock-data.js --create-mock-users
```

- To create mock artists:

```sh
node ./mock-data/seed-mock-data.js --create-mock-artists
```

- To create mock albums:

```sh
node ./mock-data/seed-mock-data.js --create-mock-albums
```

- To create mock songs:

```sh
node ./mock-data/seed-mock-data.js --create-mock-songs
```

## Combined Execution

```sh
node ./mock-data/seed-mock-data.js --create-mock-users && \
node ./mock-data/seed-mock-data.js --create-mock-artists && \
node ./mock-data/seed-mock-data.js --create-mock-albums && \
node ./mock-data/seed-mock-data.js --create-mock-songs
```
