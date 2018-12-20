# wikidata-highlight

This repo containts two parts:

1. A server to extract keywords from a webpage, which then get enriched by a wikidata search
2. A user script on the browser, that adds calls the server and displays the result as highlighted text + tooltips

![Screenshot of wikidata-highlight](https://raw.githubusercontent.com/metaodi/wikidata-highlight/master/wikidata-highlight.png)


## Usage

1. Install the user script
2. Run the NER and search components seperately (`npm run search`, `npm run ner`)
3. Start the webserver (`npm run index`)
4. Start browsing swissinfo.ch and wait for highlighted terms to appear to give more context


## Deployment

This application is deployed on heroku, please add the heroku remote to deploy:

```
heroku login
heroku git:remote -a swiss-highlight
```

Make sure the CloudAMQP add-on is installed.

### Buildpacks

Since we want to use both Node.js and Python, we need to tell heroku to use two buildpacks:

```
heroku buildpacks:add --index 1 heroku/nodejs
heroku buildpacks:add --index 2 heroku/python
```
