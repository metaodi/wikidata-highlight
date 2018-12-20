const request = require('superagent');
var unfluff = require('unfluff');
var retext = require('retext')
var keywords = require('retext-keywords')
var toString = require('nlcst-to-string')

var url = process.env.CLOUDAMQP_URL || "amqp://localhost";
var open = require('amqplib').connect(url);

open.then(function(conn) {
    return conn.createChannel()
        .then(function(ch) {
            var q = 'tasks';
            ch.assertQueue(q, { durable: false });
            var ner = 'ner';
            ch.assertQueue(ner, { durable: false });

            ch.consume(q, function(msg) {
                if (msg !== null) {
                    var contentUrl = msg.content.toString();

                    console.log("url", contentUrl);

                    getUrlContent(contentUrl)
                        .then(function(text) {
                            console.log("Got text of URL, extracting entities...");
                            return getNamedEntities(text);
                        })
                        .then(function(entities) {
                            var data = {'url': contentUrl, 'entities': entities};
                            console.log("entities data", data);
                            ch.sendToQueue(ner, new Buffer(JSON.stringify(data)));
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

function getNamedEntities(inputText) {
    return new Promise(function(resolve, reject) {
        retext()
          .use(keywords)
          .process(inputText, function(err, text) {

              if (err) {
                  reject(err);
                  return;
              }

              var keyphrases = [];
              text.data.keyphrases.forEach(function(phrase) {
                  keyphrases.push(phrase.matches[0].nodes.map(stringify).join(''));

                  function stringify(value) {
                      return toString(value);
                  }
              })

              resolve(keyphrases);
          });
    });
}
