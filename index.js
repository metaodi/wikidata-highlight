const express = require('express');
var cors = require('cors')
var httpProxy = require('http-proxy');
var modifyResponse = require('./zip_response');

var amqp = require('amqplib');

const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
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
        modifyResponse(res, proxyRes, function (body) {
            if (body && proxyRes.headers["content-type"] && proxyRes.headers["content-type"].indexOf("text/html") >=0) {
                body = body.replace(/href="\//g, 'href="/swissinfo/');
                body = body.replace(/src="\/([^\/])/g, 'src="/swissinfo/$1');
                body = body.replace(/https:\/\/www.swissinfo.ch\//g, '/swissinfo/');
                body = body.replace('</body>', '<script src="/socket.io/socket.io.js"></script>\n<script src="/wikidata-highlight.js"></script>\n</body>');
            }
            return body; // return value can be a promise
        });
        proxyRes.on('data', (data) => {
            res.write(data);
        });
        proxyRes.on('end', (data) => {
            res.end();
        });
   }
});

app.get(["/image/*", "/static/*", "/blob/*", "/blueprint/*"], function(req, res) {
    proxy.web(req, res, {target: 'https://www.swissinfo.ch' + req.path});
});
app.get("/swissinfo/*", function(req, res) {
    swiPath = req.path.replace(/^\/swissinfo/, '');
    proxy.web(req, res, {target: 'https://www.swissinfo.ch' + swiPath});
});
app.get("/", function(req, res) {
    res.redirect('/swissinfo/eng');
});

var url = process.env.CLOUDAMQP_URL || "amqp://localhost";
io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('get_highlights', function(data) {
        console.log("get_highlights request", data);
        socket.join(data.url);
        var q = 'tasks';
        sendDataToQueue(data.url, q);
        consumeDataFromQueue(data.url);
     });
});

const port = process.env.PORT || 3000;
http.listen(port, () => console.log(`Example app listening on port ${port}!`))


function sendDataToQueue(data, queue) {
    return amqp.connect(url)
        .then(function(conn) {
            return conn.createChannel()
                .then(function(ch) {
                    ch.assertQueue(queue, { durable: false });
                    ch.sendToQueue(queue, new Buffer(data));
                });
        })
        .catch(function(err) {
            console.error("Error while sending data: ", err);
        });
}

function consumeDataFromQueue(queue) {
    return amqp.connect(url)
        .then(function(conn) {
            return conn.createChannel()
                .then(function(ch) {
                    ch.assertQueue(queue, { durable: false });
                    ch.consume(queue, function(msg) {
                      if (msg !== null) {
                        data = JSON.parse(msg.content.toString());
                        console.log("Sending highlights", queue, data);
                        io.to(queue).emit('highlights', data);
                      } else {
                        io.to(queue).emit('highlights', []);
                      }
                      conn.close();
                    }, {noAck: true});
                });
        })
}
