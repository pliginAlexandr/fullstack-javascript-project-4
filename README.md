### Hexlet tests and linter status:
[![Actions Status](https://github.com/pliginAlexandr/fullstack-javascript-project-4/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/pliginAlexandr/fullstack-javascript-project-4/actions)

### SonarQube check
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=pliginAlexandr_fullstack-javascript-project-4&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=pliginAlexandr_fullstack-javascript-project-4)

**Page Loader** — utility for downloading web pages and their local resources (images, scripts, styles). 
Useful for offline access and analysis of site structure.

---

## Installation

```bash
git clone https://github.com/USERNAME/fullstack-javascript-project-4.git
cd fullstack-javascript-project-4
make install
```

## Install as global utility:
```bash
npm link
```

### Usage:

#### Load page into current directory:
```bash
page-loader https://site.com/blog/about
```

#### Upload page to specified directory:
```bash
page-loader -o /tmp https://site.com/blog/about
```

#### As a result, a file will be created:
```bash
site-com-blog-about.html
```

#### And a directory with resources:
```bash
site-com-blog-about_files/
```
### DEBUGING
For debugging, you can enable logging using the DEBUG environment variable.

```bash
# Logging axios requests
DEBUG=axios page-loader https://site.com/blog/about

# Logging the utility's operation
DEBUG=page-loader page-loader https://site.com/blog/about

# Full debug output (axios + page-loader)
DEBUG=axios,page-loader page-loader https://site.com/blog/about
```
### Possibilities:
* Downloading HTML page and local resources (images, styles, scripts)
* Save to the specified directory
* Correctly update paths within HTML
* Displaying download progress via listr
* Handling network and file errors

### Asciinema demo:
[![asciicast](https://asciinema.org/a/44aBXEfLcD9LAHi0oXae6ajrR.svg)](https://asciinema.org/a/44aBXEfLcD9LAHi0oXae6ajrR)

## DEVELOPMENT:

### Tests starting:
```bash
make test
```
### Nock debug:
You can also use nock debugging:
```bash
NODE_DEBUG=nock:* make test
```

### Test-coverage:
```bash
make test-coverage
```

### Linting:
```bash
make lint
```
