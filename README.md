# Sonic Connect

APIs for music streaming covering essential functionalities for user management,
browsing albums and songs, managing playlists, and searching songs by
artists/albums.

### Getting started

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

3. Start the application:
```bash
npm run dev
```

To set up the app in a production environment:

Follow the same steps as above, but to start the application, run:
```bash
npm run prod
```

### Mock Data Seeder Script

For seeding databases with mock data for development and testing, use the
[mock data seeder script](mock-data/SCRIPT_GUIDE.md). This script allows you to
generate mock users, artists, albums, and songs in the database.

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
