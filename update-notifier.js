#!/usr/bin/env node

// First-Party Imports
const fs = require('fs');
const { join, relative, resolve } = require('path');
const { promisify } = require('util');

// Third-Party Imports
const { green, yellow } = require('colors');
const ncu = require('npm-check-updates');

// Promisification of `fs` methods.
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Constants
const HOME = require('os').homedir();
const ROOT = resolve(process.argv[2] || `${HOME}/code/chrisaguilar`);

/**
 * Gets the number of updates for a `package.json` file.
 *
 * @param {string} packageFile The `package.json` to check.
 * @returns {Promise<number>} The number of packages that can be updated.
 */
async function getNumUpdates(packageFile) {
    return Object.keys(await ncu.run({ packageFile, upgradeAll: true })).length;
}

/**
 * Checks if the given file is a directory.
 *
 * @param {string} file The file to check.
 * @returns {Promise<boolean>} True if `file` is a directory, false otherwise.
 */
async function isDir(file) {
    return (await stat(file)).isDirectory();
}

/**
 * Prints out the number of updates for a given directory, with nice colors and formatting.
 *
 * @param {string} dir The directory that contains a package.json.
 * @param {number} updates The number of updates.
 * @returns {Promise<void>}
 */
function prettyPrint(dir, updates) {
    const nicePath = (relative(ROOT, dir) || dir).green;
    const niceNum = updates.toString().padStart(2).yellow;
    console.log(niceNum, 'updates available for', nicePath);
}

/**
 * Reads a directory and loops over its contents, descending into subdirectories and looking for a package.json
 *
 * @param {string} dir
 * @returns {Promise<void>}
 */
async function traverse(dir) {
    const contents = await readdir(dir);
    for (const file of contents) {
        const path = join(dir, file);

        if ((await isDir(path)) && file !== 'node_modules')
            await traverse(path);
        else if (file === 'package.json')
            prettyPrint(dir, await getNumUpdates(path));
    }
}

/**
 * Begin descending into the ROOT directory, looking for outdated `package.json`s.
 *
 * @returns {Promise<void>}
 */
async function main() {
    try {
        await traverse(ROOT);
    } catch (e) {
        console.error(e);
    }
}

// Run the main function.
main();
