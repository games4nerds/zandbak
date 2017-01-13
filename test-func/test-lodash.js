const assert = require('assert');

const zandbak = require('../app/zandbak');

const sandbox = zandbak({
    zandbakOptions: { workersCount: 2, maxWorkersCount: 5 },
    eAppOptions: {
        showDevTools: true,
        browserWindow: { width: 400, height: 400, show: true },
        urlOptions: { userAgent: '_qd-ua' },
        sand: 'lodash', // sand = 'lodash' | 'css'
    }
});

const rounds = [
    {
        content: [
            { name: 'Johnie', surname: 'Walker', age: 14 },
            { name: 'Johnie', surname: 'Walker', age: 20 },
            { name: 'Adam', surname: 'Smith', age: 99 },
        ],
        options: {
            reloadWorkers: false,
            refillWorkers: false,
            taskTimeoutMs: 500,
        }
    },
    {
        content: {
            state: 'DC',
            list: ['W', 'A', 'S', 'D']
        },
        options: {
            reloadWorkers: false,
            refillWorkers: false,
            taskTimeoutMs: 500,
        }
    }
];

function onTaskSolved(task, error, result) {
    console.log('[test-lodash]', 'Task solved', task, '; error', error, '; result:', result);

    switch (task.id) {
        case 'task-0':
            return assert.deepEqual(result, ['Johnie', 'Johnie', 'Adam']);
        case 'task-1':
            assert.ok(error);
            assert.ifError(result);
            return;
        case 'task-2':
            return assert.deepEqual(result, [14, 20, 99]);
        case 'task-3':
            assert.ok(error);
            assert.ifError(result);
            return;
        case 'task-4':
            return assert.equal(result, 'DC');
        default:
            return assert.ok(false, 'unknown task id');
    }
}

sandbox.on('solved', onTaskSolved);

sandbox
    .resetWith(rounds[0])
    .exec({ id: 'task-0', input: 'map("name")' }) // OK
    .exec({ id: 'task-1', input: 'map(name")' }) // internal error
    .exec({ id: 'task-2', input: 'map((a) => a.age)' }); // OK

setTimeout(() => {
    sandbox
        .exec({ id: 'task-3', input: 'map((a) => a.surname)' }) // interrupted error
        .resetWith(rounds[1])
        .exec({ id: 'task-4', input: 'get("state")' }); // OK
}, 5000);

setTimeout(sandbox.destroy, 10000);
