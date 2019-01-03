var retext = require('retext')
var keywords = require('retext-keywords')
var toString = require('nlcst-to-string')

var url = process.env.CLOUDAMQP_URL || "amqp://localhost";
var open = require('amqplib').connect(url);

open.then(function(conn) {
    return conn.createChannel()
        .then(function(ch) {
            var q = 'text';
            ch.assertQueue(q, { durable: false });
            var ner = 'ner';
            ch.assertQueue(ner, { durable: false });

            console.log("Wating for NER requests");
            ch.consume(q, function(msg) {
                if (msg !== null) {
                    var data = JSON.parse(msg.content.toString());

                    console.log("Got text of URL, extracting entities...");
                    getNamedEntities(data.text)
                        .then(function(entities) {
                            var data = {'url': data.url, 'entities': entities};
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
                  entity = phrase.matches[0].nodes.map(stringify).join('');
                  keyphrases.push({'original': entity, 'term': entity});

                  function stringify(value) {
                      return toString(value);
                  }
              })

              resolve(keyphrases);
          });
    });
}
