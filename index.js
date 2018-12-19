const express = require('express');
var cors = require('cors')
var httpProxy = require('http-proxy');
var modifyResponse = require('./zip_response');


const app = express();
app.use(cors());
app.use(express.static('public'))


var options = {
  changeOrigin: true,
  ignorePath: true,
  selfHandleResponse: true
}
var proxy = httpProxy.createProxyServer(options);

proxy.on('proxyRes', function (proxyRes, req, res) {
    if (proxyRes.headers["content-type"] && proxyRes.headers["content-type"].indexOf("image") >=0) {
       proxyRes.pipe(res);
    } else {
        console.log(proxyRes.headers);
        console.log("Modify proxy response");
        modifyResponse(res, proxyRes, function (body) {
            console.log("got body, modifying now...");
            if (body && proxyRes.headers["content-type"] && proxyRes.headers["content-type"].indexOf("text/html") >=0) {
                body = body.replace(/href="\//g, 'href="/swissinfo/');
                body = body.replace(/src="\/([^\/])/g, 'src="/swissinfo/$1');
                body = body.replace(/https:\/\/www.swissinfo.ch\//g, '/swissinfo/');
                body = body.replace('</body>', '<script src="/wikidata-highlight.js"></script>\n</body>');
            }
            return body; // return value can be a promise
        });
        proxyRes.on('data', (data) => {
            console.log("got data");
            res.write(data);
        });
        proxyRes.on('end', (data) => {
            console.log("end of data");
            res.end();
        });
   }
});

app.get(["/image/*", "/static/*", "/blob/*", "/blueprint/*"], function(req, res) {
    console.log("got here");
    proxy.web(req, res, {target: 'https://www.swissinfo.ch' + req.path});
});
app.get("/swissinfo/*", function(req, res) {
    console.log("got here");
    console.log(req.path);
    swiPath = req.path.replace(/^\/swissinfo/, '');
    console.log(swiPath);
    proxy.web(req, res, {target: 'https://www.swissinfo.ch' + swiPath});
});

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
