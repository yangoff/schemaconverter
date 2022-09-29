import chalk from 'chalk';
import mysql from 'mysql';
import inquirer from 'inquirer';
import generateSchemaType from './generateSchema.js';

export default async function connectDB(dataCredentials) {
    let DBC;
    let tableIndexing = '';
    let typeOfConvert = '';

    if (dataCredentials) {
        DBC = {
            source: dataCredentials[0],
            user: dataCredentials[1],
            pass: dataCredentials[2],
            targetDB: dataCredentials[3],
        };
    } else {
        let dataConnect = {
            source: '',
            user: '',
            pass: '',
            targetDB: ''
        };

        //Get Source
        await inquirer.prompt([
            {
                name: 'source',
                message: 'Insert source address os server (target) ',
                type: 'input',
                validate: async (input) => {
                    if (!input) {
                        return 'Incorrect Source';
                    }
                    return true;
                }
            },
        ]).then(function (res) {
            if (res) dataConnect.source = res.source;
        }, function (err) {
            console.log('we died! %s', err);
        });

        //Get User
        await inquirer.prompt([
            {
                name: 'user',
                message: 'Insert user of server ',
                type: 'input',
                validate: async (input) => {
                    if (!input) {
                        return 'Incorrect User';
                    }
                    return true;
                }
            },
        ]).then(function (res) {
            if (res) dataConnect.user = res.user;
        }, function (err) {
            console.log('we died! %s', err);
        });

        //Get Password
        await inquirer.prompt([
            {
                name: 'pass',
                message: 'Insert password of user ',
                type: 'input',
                validate: async (input) => {
                    if (!input) {
                        return 'Incorrect Password';
                    }
                    return true;
                }
            },
        ]).then(function (res) {
            if (res) dataConnect.pass = res.pass;
        }, function (err) {
            console.log('we died! %s', err);
        });

        //Get database
        await inquirer.prompt([
            {
                name: 'targetDB',
                message: 'Insert source database target ',
                type: 'input',
                validate: async (input) => {
                    if (!input) {
                        return 'Incorrect Database';
                    }
                    return true;
                }
            },
        ]).then(function (res) {
            if (res) dataConnect.targetDB = res.targetDB;
        }, function (err) {
            console.log('we died! %s', err);
        });

        DBC = dataConnect;
    }


    console.log(chalk.bgWhite.blue('Connected On: '));
    console.log(chalk.green('Source DB: '), chalk.bgWhite.black(DBC.source));
    console.log(chalk.green('User DB: '), chalk.bgWhite.black(DBC.user));
    console.log(chalk.green('Pass DB: '), chalk.bgWhite.black(DBC.pass));
    console.log(chalk.green('Target DB: '), chalk.bgWhite.black(DBC.targetDB));

    let con = mysql.createConnection({
        host: DBC.source,
        user: DBC.user,
        password: DBC.pass,
        database: DBC.targetDB
    });

    await con.connect(async function (err) {
        if (err) {
            console.log(chalk.bgBlack.red('\n Got error!'));
        } else {
            // console.log(chalk.bgBlack.green('\n Connect!'));
        }
    });

    //Get and verify table
    await inquirer.prompt([
        {
            name: 'tableName',
            message: ' Enter the Table/View you want to index ',
            type: 'input',
            validate: async (input) => {
                if (input) {
                    let res;
                    const verifyExist = () => {
                        return new Promise((resolve, reject) => {
                            con.query(`select * from ${input} limit 0`, async function (error, results, fields) {
                                return error ? reject('Incorrect/Dont exist Table') : resolve(true);
                            });
                        });
                    };
                    res = await verifyExist();
                    return res;
                } else {
                    return 'Incorrect information';
                }
            }
        },
    ]).then(function (res) {
        if (res) tableIndexing = res.tableName;
    }, function (err) {
        console.log('we died! %s', err);
    });

    await inquirer.prompt([
        {
            name: 'typeOfConvert',
            message: ' Enter the Type of output ',
            type: 'list',
            choices: ['Javascript', 'Typescript', 'Dart'],
            validate: async (input) => {
                if (!input) {
                    return 'Incorrect option';
                }
                return true;
            }
        },
    ]).then(function (res) {
        if (res) typeOfConvert = res.typeOfConvert;
    }, function (err) {
        console.log('we died! %s', err);
    });

    const readTable = () => {
        return new Promise((resolve, reject) => {
            con.query(`describe ${tableIndexing}`, async function (error, results, fields) {
                return error ? reject('Error on read table') : resolve(results.map(v => Object.assign({}, v)));
            });
        });
    };

    let table_describe = await readTable();

    await generateSchemaType(tableIndexing, table_describe, typeOfConvert, false, false);

    let again = true;

    while (again === true){
        await inquirer.prompt([
            {
                name: 'indexAgain',
                message: 'You want continue indexing another Table/View? (Y/N)',
                type: 'input',
                validate: (input) => {
                    if (['Y','N'].includes(input.toLocaleUpperCase())) {
                        return true;
                    }
                    return 'Incorrect answer';
                }
            },
        ]).then(function (res) {
            again = res.indexAgain.toLocaleUpperCase() === 'Y';
        }, function (err) {
            console.log('we died! %s', err);
        });

        if(again){
            await inquirer.prompt([
                {
                    name: 'tableName',
                    message: ' Enter the Table/View you want to index ',
                    type: 'input',
                    validate: async (input) => {
                        if (input) {
                            let res;
                            const verifyExist = () => {
                                return new Promise((resolve, reject) => {
                                    con.query(`select * from ${input} limit 0`, async function (error, results, fields) {
                                        return error ? reject('Incorrect/Dont exist Table') : resolve(true);
                                    });
                                });
                            };
                            res = await verifyExist();
                            return res;
                        } else {
                            return 'Incorrect information';
                        }
                    }
                },
            ]).then(function (res) {
                if (res) tableIndexing = res.tableName;
            }, function (err) {
                console.log('we died! %s', err);
            });

            await generateSchemaType(tableIndexing, table_describe, typeOfConvert, false, false);
        }
    }
    con.end();
    console.log('End of session');
    return false;
}

