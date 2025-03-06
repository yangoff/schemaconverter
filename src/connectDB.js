import generateSchemaType from "./generateSchema.js";
    import chalk from "chalk";
    import inquirer from "inquirer";
    import mysql from "mysql";

    export default async function connectDB(dataCredentials) {
        let DBC;
        let tableIndexing = '';
        let typeOfConvert = '';
        let con;

        try {
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

                // Get Source
                await inquirer.prompt([
                    {
                        name: 'source',
                        message: 'Insert source address of server (target) ',
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

                // Get User
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

                // Get Password
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

                // Get database
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

            con = mysql.createConnection({
                host: DBC.source,
                user: DBC.user,
                password: DBC.pass,
                database: DBC.targetDB
            });

            await con.connect(async function (err) {
                if (err) {
                    console.log(chalk.bgBlack.red('\n Got error!'));
                    throw err;
                }
            });

            const readTable = (tableName) => {
                return new Promise((resolve, reject) => {
                    con.query(`describe \`${tableName}\``, async function (error, results, fields) {
                        return error ? reject('Error on read table') : resolve(results.map(v => Object.assign({}, v)));
                    });
                });
            };

            let again = true;

            while (again === true) {
                await inquirer.prompt([
                    {
                        name: 'tableName',
                        message: 'Enter the Table/View you want to index ',
                        type: 'input',
                        validate: async (input) => {
                            if (input) {
                                let res;
                                const verifyExist = () => {
                                    return new Promise((resolve, reject) => {
                                        con.query(`select * from \`${input}\` limit 0`, async function (error, results, fields) {
                                            return error ? reject('Incorrect/Don\'t exist Table') : resolve(true);
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
                    {
                        name: 'typeOfConvert',
                        message: 'Enter the Type of output ',
                        type: 'list',
                        choices: ['Javascript', 'Typescript', 'Dart'],
                        validate: async (input) => {
                            if (!input) {
                                return 'Incorrect option';
                            }
                            return true;
                        }
                    },
                ]).then(async function (res) {
                    tableIndexing = res.tableName;
                    typeOfConvert = res.typeOfConvert;

                    let table_describe = await readTable(tableIndexing);
                    await generateSchemaType(tableIndexing, table_describe, typeOfConvert, false, false);

                    await inquirer.prompt([
                        {
                            name: 'indexAgain',
                            message: 'You want to continue indexing another Table/View? (Y/N)',
                            type: 'input',
                            validate: (input) => {
                                if (['Y', 'N'].includes(input.toLocaleUpperCase())) {
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
                }, function (err) {
                    console.log('we died! %s', err);
                });
            }
        } catch (error) {
            console.error('An error occurred:', error);
        } finally {
            if (con) {
                con.end();
            }
            console.log('End of session');
        }
        return false;
    }