#!/usr/bin/env node
console.clear();
import { readdirSync, readFileSync, writeFileSync } from "fs";
import inquirer from "inquirer";
import chalk from "chalk";
const version = JSON.parse(readFileSync(`${import.meta.dirname}/package.json`).toString()).version;

await inquirer.prompt([{ message: chalk.red(`Version: v${version}\nPlease start your server once before using this tool\nOnly use the Development BP and RP folders\nRun this at the top level of the Server where the bedrock_server(.exe) is`) }]);

const { levelName } = await inquirer.prompt([{
    message: chalk.yellow("Please select the world (worldFolderName)"),
    name: "levelName",
    type: "checkbox",
    choices: readdirSync("./worlds"),
}]);
if (!levelName || levelName.length === 0) {
    await inquirer.prompt([{ message: chalk.red("Could not find any Worlds in your worlds folder") }])
}
const worldPath = `./worlds/${levelName}/`;

for (const pack of ["resource", "behavior"]) {
    /** @type {{pack_name: string; pack_id: string; version: number[]}[]} */
    const list = readdirSync(`./development_${pack}_packs`).map(el => {
        const manifest = JSON.parse(readFileSync(`./development_${pack}_packs/${el}/manifest.json`).toString());
        return { pack_name: manifest.header.name.replaceAll(/§./g, ""), pack_id: manifest.header.uuid, version: manifest.header.version };
    });
    if (list.length === 0) continue;

    /** @type {string[]} */
    const { active } = await inquirer.prompt([{
        message: chalk.yellow("Select the packs you want to enable"),
        name: "active",
        type: "checkbox",
        choices: list.map(el => `${el.pack_name} v${el.version.join(".")}`),
    }]);

    /** @type {{pack_name: string; pack_id: string; version: number[]}[]} */
    const enabled = active.map(el => {
        const packName = el.slice(0, el.lastIndexOf(" "));
        return list.find(elNest => elNest.pack_name === packName);
    });

    const data = JSON.stringify(enabled.map(el => { return { pack_id: el.pack_id, version: el.version } }));
    writeFileSync(worldPath + `world_${pack}_packs.json`, data);
}
