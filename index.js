const fs = require('fs');
const path = require('path');
const os = require('os');

const directoryToSearchOn = '.';
const blacklistedDirectories = [
    '.git',
    '.github',
    'node_modules',
    '.idea',
    'test',
];
const baseUrl = 'https://github.com/nelo-crypto/repository/tree/main/';
const headerFile = 'HEADER.md';
const readmeDestinationFile = 'README.md';

function hasPdfInResourcePath(resourcePath) {
    return resourcePath.toLowerCase().endsWith('.pdf');
}

function generateIndentByLevel(level) {
    if (level === 0) {
        return '';
    }

    return Array
        .from(Array(level - 1).keys())
        .map(
            () => {
                return '    ';
            }
        ).join('');
}

function getNameFromResourcePath(resourcePath) {
    return resourcePath.split('/').slice(-1)[0];
}

function generatePdfFileUrlFromResourcePath(resourcePath) {
    return baseUrl + encodeURIComponent(resourcePath);
}

async function scanDirectory(directoryPath, level) {
    console.log('ScanDirectory', level, directoryPath);

    try {
        const resources = await fs.promises.readdir(directoryPath);

        let markupContent = '';

        for (const resource of resources) {
            console.log('Resource', resource);

            const resourcePath = path.join(directoryPath, resource);
            const stat = await fs.promises.stat(resourcePath);
            const isValidPdfFile = stat.isFile() && hasPdfInResourcePath(resource);
            const isValidDirectoryToScan = stat.isDirectory() && blacklistedDirectories.indexOf(resource) === -1;
            const indent = generateIndentByLevel(level + 1);

            if (isValidPdfFile) {
                console.log("'%s' is a PDF file.", resourcePath);

                const pdfFileUrl = generatePdfFileUrlFromResourcePath(resourcePath);

                markupContent += indent + '* [' + resource + '](' + pdfFileUrl + ')' + os.EOL;
            } else if (isValidDirectoryToScan) {
                console.log("'%s' is a directory.", resourcePath);

                if (resourcePath !== '.') {
                    markupContent += indent + '* **' + getNameFromResourcePath(resourcePath) + '**' + os.EOL;
                }

                markupContent += await scanDirectory(resourcePath, level + 1);
            }
        }

        return markupContent;
    } catch (e) {
        console.error('We\'ve thrown! Whoops!', e);

        return 'Error processing directory';
    }
}

(async () => {
    try {
        const bodyMarkupContent = await scanDirectory(directoryToSearchOn, 0);
        const headerMarkContent = await fs.promises.readFile(headerFile, 'binary');

        const finalMarkupContent = headerMarkContent + bodyMarkupContent;
        await fs.promises.writeFile(readmeDestinationFile, finalMarkupContent);

        console.log('Done.');
    } catch (e) {
        console.error('We\'ve thrown! Whoops!', e);
    }
})();