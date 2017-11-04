#! /usr/bin/env node

const program = require('commander');
const inquirer = require('inquirer');
const fs = require('fs');

const sfcc = require('./sfcc/');

const detectCodeVersion = async () => {
  console.log(`Attempting to detect code versions on ${process.env.SFCC_DOMAIN}`);

  const codeVersions = await sfcc.codeVersions();

  const answers = await inquirer.prompt({
    type: 'list',
    name: 'codeVersion',
    message: 'Select the code version:',
    choices: codeVersions,
  });

  return answers.codeVersion;
};

program
  .command('import [codeVersion]')
  .description(`
    Detect code versions on your instance and select one to import to your local /cartridges.
    You can also specify a code version directly.
  `)
  .action(async (codeVersion) => {
    try {
      let selectedCodeVersion;

      sfcc.checkEnv();

      if (!codeVersion) {
        selectedCodeVersion = await detectCodeVersion();
      }

      if (fs.existsSync('./cartridges')) {
        const answers = await inquirer.prompt({
          type: 'confirm',
          name: 'confirm',
          message: `Importing ${selectedCodeVersion} will remove what you currently have in /cartridges. Is this OK?`,
        });

        if (!answers.confirm) {
          return;
        }
      }

      await sfcc.import(codeVersion || selectedCodeVersion);
    } catch (error) {
      console.log(error.message);
    }
  });

program
  .command('watch [codeVersion]')
  .description('Watch file changes in /cartridges, and upload into the specified code version')
  .action(async (codeVersion) => {
    try {
      let selectedCodeVersion;

      sfcc.checkEnv();

      if (!codeVersion) {
        selectedCodeVersion = await detectCodeVersion();
      }

      sfcc.watch(codeVersion || selectedCodeVersion);
    } catch (error) {
      console.log(error.message);
    }
  });

program
  .command('deploy [codeVersion]')
  .description('Deploy /cartridges to a specified, new code version')
  .action(async (codeVersion) => {
    try {
      let selectedCodeVersion;

      sfcc.checkEnv();

      if (!codeVersion) {
        const answers = await inquirer.prompt({
          type: 'input',
          name: 'codeVersion',
          message: 'Name the code version of this deploy:',
        });

        selectedCodeVersion = answers.codeVersion;
      }

      sfcc.deploy(codeVersion || selectedCodeVersion);
    } catch (error) {
      console.log(error.message);
    }
  });

program.parse(process.argv);
