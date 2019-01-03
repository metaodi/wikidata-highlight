# wikidata-highlight

This repo containts two parts:

1. A server to extract keywords from a webpage, which then get enriched by a wikidata search
2. A user script on the browser, that adds calls the server and displays the result as highlighted text + tooltips

![Screenshot of wikidata-highlight](https://raw.githubusercontent.com/metaodi/wikidata-highlight/master/wikidata-highlight.png)

## Installation

This project uses both node and python

1. Setup a new virtualenv called `pyenv` (`virtualenv --no-site-packages pyenv`)
1. Source it `source ./pyenv/bin/activate`
1. Install python packages `pip install -r requirements.txt`
1. Install node packages `npm install`
1. Copy the .env `cp .env.dist .env` and adapt the values

## Usage

1. Run the extract, NER and search components seperately (`npm run extract`, `npm run ner`, `npm run search`)
1. Start the webserver (`npm run index`)
1. Start browsing swissinfo.ch and wait for highlighted terms to appear to give more context

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

### Environment variables

For the local installation a `.env` file is used to set environment variables.
Make sure to set those variables on heroku as well (using either the CLI or the dashboard).

To check if they are set correctly run:

```
heroku run env --app swiss-highlight
```
