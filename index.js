const express = require('express');
var cors = require('cors')

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

var url = process.env.CLOUDAMQP_URL || "amqp://localhost";
var open = require('amqplib').connect(url);

app.get('/wikidata-highlight', (req, res) => {
    if (!req.query.url) {
        res.status(400).send({error: 'URL is required'});
        return;
    }
    url = decodeURIComponent(req.query.url);

    var q = 'tasks';
    sendDataToQueue(url, q);

    var s = 'search';
    consumeDataFromQueue(s)
        .then(function(data) {
            console.log(data);
            res.end(JSON.stringify(data));
        })
        .catch(function(err) {
            console.error("Error while consuming data: ", err);
        });
});
app.listen(port, () => console.log(`Example app listening on port ${port}!`))


function sendDataToQueue(data, queue) {
    var rqConn;
    open.then(function(conn) {
        rqConn = conn;
        return conn.createChannel();
    })
    .then(function(ch) {
        ch.assertQueue(queue, { durable: false });
        return ch.sendToQueue(queue, new Buffer(data));
    })
    .catch(function(err) {
        console.error("Error while sending data: ", err);
    });
}

function consumeDataFromQueue(queue) {
    return new Promise(function(resolve, reject) {
        var rqConn;
        open.then(function(conn) {
            rqConn = conn;
            return conn.createChannel();
        })
        .then(function(ch) {
            ch.assertQueue(queue, { durable: false });
            ch.consume(queue, function(msg) {
              if (msg !== null) {
                data = JSON.parse(msg.content.toString());
                console.log(data);
                resolve(data);
              }
            }, {noAck: true});
        })
    });
}
