const request = require('superagent');
var unfluff = require('unfluff');

var url = process.env.CLOUDAMQP_URL || "amqp://localhost";
var open = require('amqplib').connect(url);

open.then(function(conn) {
    return conn.createChannel()
        .then(function(ch) {
            var q = 'tasks';
            ch.assertQueue(q, { durable: false });
            var tq = 'text';
            ch.assertQueue(tq, { durable: false });

            ch.consume(q, function(msg) {
                if (msg !== null) {
                    var contentUrl = msg.content.toString();

                    console.log("URL request:", contentUrl);

                    getUrlContent(contentUrl)
                        .then(function(text) {
                            console.log("Got text:", text);
                            var data = {'url': contentUrl, 'text': text};
                            ch.sendToQueue(tq, new Buffer(JSON.stringify(data)));
                        })
                        .catch(function(err) {
                            console.error("Error extracting named entities:", err);
                        });
                }
            }, {noAck: true});
        });
})
.catch(function(err) {
    console.error("Error while handling AMQP: ", err);
});


function getUrlContent(url) {
    return new Promise(function(resolve, reject) {
        request
          .get(url)
          .then(response => {
              if (!response.ok) {
                  reject();
                  return;
              }
              resolve(unfluff(response.text).text);
          })
          .catch(function(err) {
              reject(err);
          });
    });
}
