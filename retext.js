const request = require('superagent');
var unfluff = require('unfluff');
var vfile = require('to-vfile')
var retext = require('retext')
var keywords = require('retext-keywords')
var toString = require('nlcst-to-string')

// get text from URL

url = 'https://www.swissinfo.ch/eng/corruption_venezuelan-ex-minister-hoarded-money-in-switzerland/44612456';
request
  .get(url)
  .end((err, res) => {
      if (res.ok) {
          data = unfluff(res.text);
          retext()
            .use(keywords)
            .process(data.text, done)

      }
  });

function done(err, file) {
  if (err) throw err

  console.log('Keywords:')
  file.data.keywords.forEach(function(keyword) {
    console.log(toString(keyword.matches[0].node))
  })

  console.log()
  console.log('Key-phrases:')
  file.data.keyphrases.forEach(function(phrase) {
    console.log(phrase.matches[0].nodes.map(stringify).join(''))
    function stringify(value) {
      return toString(value)
    }
  })
}
