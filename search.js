var WikidataSearch = require('wikidata-search').WikidataSearch;
var wikidataSearch = new WikidataSearch();

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
			var data = await search(entity.term);
			data_value = {'term': entity.original, 'data': data};
			return data_value;
		});
		Promise.all(promises).then(function(values) {
			resolve(values);
		});
	});
}

function search(term) {
    wikidataSearch.set('search', term); //set the search term
    return new Promise((resolve, reject) => {
        wikidataSearch.search(function(result, err) {
            if (err) {
                reject(err);
                return;
            }
            
            if (result.results.length > 0) {
                console.log(term, result.results[0]);
                resolve(result.results[0]);
            } else {
                resolve(null);
            }
        });
    });
}

