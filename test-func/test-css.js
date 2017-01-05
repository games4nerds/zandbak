/*
 * Html page (round placeholder) should look like:

<!DOCTYPE html>
<html>
<body>
<!-- markup goes here -->
<script>
    var ipcRenderer = require('electron').ipcRenderer;

    function send(result) {
        return ipcRenderer.send('worker::solved', result);
    }

    function exec(task, done) {
        try {
            var result = document.querySelectorAll(task.payload.selector);
            done({ result: result});
        } catch (e) {
            done({ error: e });
        }
    }

    ipcRenderer.on('e-app::exec', function(message) {
        if (!message) {
            console.log('worker::onMessage', 'empty message, do nothing');
            return send({ message: message, error: 'empty message' });
        }

        if (message.type !== 'worker::exec') {
            console.log('worker::onMessage', 'unknown message type', message.type);
            return send({ message: message, error: 'unknown message type' });
        }

        exec(message.payload, send);
    });
</script>
</body>
</html>

 */

const zandbak = require('../app/zandbak');

const sandbox = zandbak({
    zandbakOptions: { workersCount: 2, maxWorkersCount: 5 },
    eAppOptions: { showDevTools: false, browserWindow: { width: 400, height: 400, show: false } }
});

const rounds = [
    {
        url: `data:text/html,<!DOCTYPE html><html><body>
                <div class='parent'><span>child 0</span><h1>child 1</h1></div>
            <script>
                var ipcRenderer = require('electron').ipcRenderer;

                function send(result) {
                    return ipcRenderer.send('worker::solved', result);
                }

                function exec(task, done) {
                    try {
                        var result = document.querySelectorAll(task.payload.selector);
                        done({ result: result});
                    } catch (e) {
                        done({ error: e });
                    }
                }

                ipcRenderer.on('e-app::exec', function(event, message) {
                    if (!message) {
                        console.log('worker::onMessage', 'empty message, do nothing');
                        return send({ message: message, error: 'empty message' });
                    }

                    if (message.type !== 'worker::exec') {
                        console.log('worker::onMessage', 'unknown message type', message.type);
                        return send({ message: message, error: 'unknown message type' });
                    }

                    exec(message.payload, send);
                });
            </script>
            </body>
            </html>`,
        urlOptions: { userAgent: 'cssqd-ua' },
        reloadWorkers: false,
        taskTimeoutMs: 500
    },
    {
        url: 'http://www.brainjar.com/java/host/test.html',
        urlOptions: { userAgent: 'cssqd-ua' },
        reloadWorkers: false,
        taskTimeoutMs: 500
    }
];


const timing = {};
let avgTimingNanoSec = 0;

function onTaskSolved(task, result) {
    const diff = process.hrtime(timing[task.taskId]);

    console.log('[test-css]', 'Task solved', task, '; result:', result, 'time:', diff);

    avgTimingNanoSec += ((diff[0] * 1000000000) + diff[1]);
}

sandbox.on('solved', onTaskSolved);


sandbox.resetWith(rounds[0]);

const tasksCount = 100;
let taskIterator = tasksCount;
while (--taskIterator >= 0) {
    const timeout = Math.floor(Math.random() * 50);
    // eslint-disable-next-line
    setTimeout(((taskId) => (() => {
        timing[taskId] = process.hrtime();
        sandbox.exec({ taskId, payload: { selector: `h${taskIterator}` } });
    }))(taskIterator), (timeout * 1000));
}


setTimeout(() => {
    console.log('[test-css]', 'Sum task time: ', avgTimingNanoSec / 1000000000, 'sec');
    console.log('[test-css]', 'Avg task time: ', ((avgTimingNanoSec / tasksCount) / 1000000000), 'sec');

    sandbox.off('solved', onTaskSolved);
    sandbox.destroy();
}, 20000);
