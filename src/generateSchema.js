import * as fs from 'fs';
import chalk from 'chalk';

export default async function generateSchemaType(tableName, data, type, useOptional, useDefault) {
    let fields = '';
    data.forEach((d)=>{
        fields+= getLine(d, type, useOptional, useDefault);
    })
    let template = '';
    switch (type) {
        case 'Javascript':
            template = templatizeJS(tableName, fields);
            break;
        case 'Typescript':
            template = templatizeTS(tableName, fields);
            break;
        case 'Dart':
            template = templatizeDart(tableName, fields);
            break;
    }

    const execute = async () => {
        try {
            fs.writeFileSync(`${tableName}${getExtByType(type)}`, template);
            console.log(chalk.bgBlack.green('File write successful on ROOT '));
        } catch (err) {
            console.log(chalk.bgBlack.red('Error on make File'));
        }
    };

    await execute();

}

function getLine(data, type, optional, useDefault) {
    let {Field, Type, Null, Key, Default, Extra} = data;
    switch (type) {
        case 'Javascript':
            return getLineJS(Field, identifyFieldType(Type, type), optional && (Null === 'YES')) + ', \n';
        case 'Typescript':
            return getLineTS(Field, identifyFieldType(Type, type), optional && (Null === 'YES'), useDefault ? Default : undefined) + ', \n';
        case 'Dart':
            return getLineDart(Field, identifyFieldType(Type, type), optional && (Null === 'YES'), useDefault ? Default : undefined) + '; \n';
    }
}

//Lines
function getLineJS(field, type) {
    return `    ${field}: ${type}`;
}

function getLineTS(field, type, optional, defaultValue) {
    return `    ${field}${optional === true ? ' ?' : '' }: ${type} ${(defaultValue !== undefined) ? ' = '+defaultValue : ''}`;
}

function getLineDart(field, type, optional, defaultValue) {
    return `    ${type}${optional === true ? ' ?' : ''} ${field} ${(defaultValue !== undefined) ? ' = '+defaultValue : ''}`;
}

//Types
function identifyFieldType(field, type) {
    let t = field.toString();
    let stringConditions = ['varchar', 'text', 'json'];
    let booleanConditions = ['tinyint'];
    let dateConditions = ['date'];
    let dateTimeConditions = ['datetime'];
    let integerConditions = ['int'];
    let doubleConditions = ['decimal', 'double', 'float'];

    switch (true) {
        case stringConditions.reduce((a, c) => a + t.includes(c), 0) === 1:
            return getString(type);
        case booleanConditions.reduce((a, c) => a + t.includes(c), 0) === 1:
            return getBoolean(type);
        case dateTimeConditions.reduce((a, c) => a + t.includes(c), 0) === 1:
            return getDateTime(type);
        case dateConditions.reduce((a, c) => a + t.includes(c), 0) === 1:
            return getDate(type);
        case integerConditions.reduce((a, c) => a + t.includes(c), 0) === 1:
            return getInteger(type);
        case doubleConditions.reduce((a, c) => a + t.includes(c), 0) === 1:
            return getDouble(type);
    }
}

function getString(type) {
    switch (type) {
        case 'Javascript':
            return 'PropTypes.string';
        case 'Typescript':
            return 'string';
        case 'Dart':
            return 'String';
    }
}

function getBoolean(type) {
    switch (type) {
        case 'Javascript':
            return 'PropTypes.boolean';
        case 'Typescript':
            return 'boolean';
        case 'Dart':
            return 'bool';
    }
}

function getInteger(type) {
    switch (type) {
        case 'Javascript':
            return 'PropTypes.number';
        case 'Typescript':
            return 'number';
        case 'Dart':
            return 'int';
    }
}

function getDate(type) {
    switch (type) {
        case 'Javascript':
            return 'PropTypes.Date';
        case 'Typescript':
            return 'Date';
        case 'Dart':
            return 'Date';
    }
}

function getDouble(type) {
    switch (type) {
        case 'Javascript':
            return 'PropTypes.number';
        case 'Typescript':
            return 'number';
        case 'Dart':
            return 'double';
    }
}

function getDateTime(type) {
    switch (type) {
        case 'Javascript':
            return 'PropTypes.Date';
        case 'Typescript':
            return 'Date';
        case 'Dart':
            return 'DateTime';
    }
}


//Template
function templatizeJS(name, fields) {
    let template = '';
    template += `I${name[0].toUpperCase() + name.slice(1)}.propTypes = {
${fields}
    }
    `;
    return template;
}

function templatizeTS(name, fields) {
    let template = '';
    template += `export type T${name[0].toUpperCase() + name.slice(1)}Schema = {
${fields}
    }
    `;
    return template;
}

function templatizeDart(name, fields) {
    let template = '';
    template += `class ${name[0].toUpperCase() + name.slice(1)} {
${fields} }
    `;
    return template;
}

function getExtByType(type) {
    switch (type) {
        case 'Javascript':
            return '.js';
        case 'Typescript':
            return '.ts';
        case 'Dart':
            return '.dart';
    }
}