const express = require('express');
var cors = require('cors')
const request = require('superagent');
var WikidataSearch = require('wikidata-search').WikidataSearch;
var wikidataSearch = new WikidataSearch();
var unfluff = require('unfluff');
var vfile = require('to-vfile')
var retext = require('retext')
var keywords = require('retext-keywords')
var toString = require('nlcst-to-string')

function search(term, callback) {
    wikidataSearch.set('search', term); //set the search term
    return new Promise((resolve, reject) => {
        wikidataSearch.search(function(result, err) {
            if (err) {
                reject(err);
                return;
            }
            
           // console.log(result);
            if (result.results.length > 0) {
                resolve(result.results[0]);
            } else {
                resolve(null);
            }

        });
    });
}

const app = express();
app.use(cors());
const port = 3000

app.get('/wikidata-highlight', (req, res) => {
    if (!req.query.url) {
        res.status(400).send({error: 'URL is required'});
    }
    url = req.query.url;
    request
      .get(url)
      .then(response => {
          if (!response.ok) {
              res.status(500).send({error: 'Could not load ' + url});
          }
          data = unfluff(response.text);
          console.log(data.text);
          retext()
            .use(keywords)
            .process(data.text, function(err, text) {
                if (err) throw err

                console.log()
                console.log('Key-phrases:')
                keyphrases = [];
                text.data.keyphrases.forEach(function(phrase) {
                   keyphrases.push(phrase.matches[0].nodes.map(stringify).join(''));
                   console.log(keyphrases);
                   function stringify(value) {
                     return toString(value);
                   }
                })

                const promises = keyphrases.map(async value => {
                    var data = await search(value);
                    data_value = {'term': value, 'data': data};
                    console.log(data_value);
                    return data_value;
                });

                Promise.all(promises).then(function(values) {
                    res.send(values);
                });
            });

      });
});
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
