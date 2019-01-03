# -*- coding: utf-8 -*-

import os
import requests
from pprint import pprint
from dotenv import load_dotenv
load_dotenv()

def get_opencalais_entities(text):
    calais_url = 'https://api.thomsonreuters.com/permid/calais'
    access_token = os.getenv('OPENCALAIS_API_TOKEN')
    headers = {'X-AG-Access-Token' : access_token, 'Content-Type' : 'text/raw', 'outputformat' : 'application/json'}

    r = requests.post(calais_url, data=dict(data=text), headers=headers, timeout=80)
    result = r.json()
    # return [v for k, v in result.items() if v.get('_typeGroup') in ['socialTag', 'entities']]
    return [v for k, v in result.items() if v.get('_typeGroup') in ['socialTag', 'entities'] and v.get('forenduserdisplay') == u'true']

def get_entities(text):
    result = get_opencalais_entities(text)
    entities = []
    for r in result:
        entity = None
        if r['_typeGroup'] == 'socialTag':
            entities.append({
                'term': r['name'],
                'original': r['name']
            })
        if r['_typeGroup'] == 'entities':
            entities.append({
                'original': r['name'],
                'term': r['name']
            })
    pprint(entities)
    return entities
