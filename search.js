var WikidataSearch = require('wikidata-search').WikidataSearch;
var wikidataSearch = new WikidataSearch();

var url = process.env.CLOUDAMQP_URL || "amqp://localhost";
var open = require('amqplib').connect(url);

// search
open.then(function(conn) {
  return conn.createChannel();
})
.then(function(ch) {
    var ner = 'ner';
    ch.assertQueue(ner, { durable: false });
    var s = 'search';
    ch.assertQueue(s, { durable: false });

    ch.consume(ner, function(msg) {
      if (msg !== null) {
        namedEntities = JSON.parse(msg.content.toString());
        console.log("terms", namedEntities);
        searchTerms(namedEntities)
            .then(function(result) {
                if (result !== null) {
                    ch.sendToQueue(s, new Buffer(JSON.stringify(result)));
                }
            });
      }
    }, {noAck: true});
})
.catch(function(err) {
    console.error("Error while connecting to AMQP: ", err);
});

function searchTerms(terms) {
    return new Promise((resolve, reject) => {
		const promises = terms.map(async term => {
			var data = await search(term);
			data_value = {'term': term, 'data': data};
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
                resolve(result.results[0]);
            } else {
                resolve(null);
            }
        });
    });
}

