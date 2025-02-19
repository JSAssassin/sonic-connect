# Sonic Connect

APIs for music streaming covering essential functionalities for user management,
browsing albums and songs, managing playlists, and searching songs by
artists/albums.

### Getting started

Requirements
* Node
* Docker

To set up the app in a development environment:

1. Clone the repository from GitHub:
```bash
git clone https://github.com/JSAssassin/sonic-connect.git
cd sonic-connect
```

2. Install the required dependencies:
```bash
npm install
```

3. create a .env file

Example:

For database creation:
PORT=3000
DB_CONN_STR=mongodb://127.0.0.1:27017
DB_NAME=sonic-connect
DB_USER=root
DB_PASSWORD=password

For JWT creation:
SECRET_STR=mysecretkey
LOGIN_EXPIRES=86400000 # 1 day in milliseconds

4. Create the database
```bash
docker compose up -d
```

Note: The database must be set up before running the application, as it is required for both development and testing.

Optional (Seed DB with mock data)
    see script for instructions [mock data seeder script](mock-data/SCRIPT_GUIDE.md)

5. At this point you can run the app
```bash
npm run dev
```

6. To run the app in a production environment, you can do it in one of 2 ways:
   1. You can run
    ```bash
    npm run prod
    ```
   2. Build docker image
    ```bash
    docker build -t sonic-connect .
    docker run sonic-connect
    ```

### Running Tests
To run the tests, use the following command:
```bash
npm run test
```
Note: The `--silent` flag is set to true in the test script. To get logs for
debugging purposes, remove the `--silent` flag from the script.

### Test Coverage
To check the test coverage, use the following command:
```bash
npm run coverage
```

### Linting
To ensure the code follows the project's style guidelines, run the linter with:
```bash
npm run lint
```

### API Documentation
For a detailed explanation of the APIs used in this project, please refer to
the [API Documentation](https://documenter.getpostman.com/view/9878109/2sA3JM7gkf).

### Contributing
Contributions to Sonic Connect are welcome! Please fork the repository, create
a new branch, and submit a pull request. Ensure that your code follows the
linting and testing guidelines.

### License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file
for more details.
