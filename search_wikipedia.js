const wiki = require('wikipediajs')
var _ = require('lodash')

var url = process.env.CLOUDAMQP_URL || "amqp://localhost";
var open = require('amqplib').connect(url);

// search
open.then(function(conn) {
    return conn.createChannel()
        .then(function(ch) {
            var ner = 'ner';
            ch.assertQueue(ner, { durable: false });

            ch.consume(ner, function(msg) {
              if (msg !== null) {
                var data = JSON.parse(msg.content.toString());
                var namedEntities = data.entities;
                var contentUrl = data.url;
                console.log("terms", namedEntities);
                console.log("contentUrl", contentUrl);
                searchTerms(namedEntities)
                    .then(function(result) {
                        console.log("SEARCH RESULT", result);
                        if (result !== null) {
                            ch.assertQueue(contentUrl, { durable: false });
                            ch.sendToQueue(contentUrl, new Buffer(JSON.stringify(result)));
                        }
                    });
              }
            }, {noAck: true});
        });
})
.catch(function(err) {
    console.error("Error while connecting to AMQP: ", err);
});

function searchTerms(entities) {
    return new Promise((resolve, reject) => {
		const promises = entities.map(async entity => {
			var data = await searchWiki(entity.term);
			data_value = {'term': entity.original, 'data': data};
			return data_value;
		});
		Promise.all(promises).then(function(values) {
			resolve(values);
		});
	});
}

function searchWiki(term) {
    return wiki.search(term, "en", {'prop': 'description'})
        .then(function(res) {
            //get results in order
            var pages = _.sortBy(res.query.pages, 'index');
            var result = _.find(pages, function(p) { 
                return p.description && p.description.indexOf('Disambiguation page') < 0;
            });
            result['label'] = result['title'];
            console.log("wikipedia", term, result);
            return result;
        })
}
