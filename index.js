#! /usr/bin/env node
import connectDB from './src/connectDB.js';
import inquirer from 'inquirer';
import chalk from 'chalk';

console.log(chalk.black.bgWhite(' Welcome to Schema Converter/Mapper \n'));

console.log(chalk.black.bgWhite(' CLI to some JavaScript to map SQL tables to interfaces \n'));
console.log(chalk.blue.bgWhite(' 0.0.1 \n'));

await inquirer.prompt([
    {
        name: 'connections',
        message: 'Insert connect credentials in this order (split with ",") => source,user,password,targetDB | or press enter to guide insert '
    },
])
    .then(answers => {
        if (answers.connections) {
            let d = answers.connections.split(',');
            if (d.length === 4) {
                return connectDB(d);
            } else {
                console.log(chalk.red('Invalid arguments'));
            }
        } else {
            return connectDB();
        }
    });