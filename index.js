const express = require('express');
const serveStatic = require('serve-static');
const path = require('path');

const app = express();

app.use(serveStatic(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
})

const port = process.env.NODE_ENV === 'production' ? 80 : 3000;

app.listen(port, err => {
    if (err) {
        console.error(err);
    } else {
        console.info(`App runnning on localhost:${port}`);
    }
});
