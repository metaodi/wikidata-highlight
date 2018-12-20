from nltk import ne_chunk, pos_tag, word_tokenize
from nltk.tree import Tree
import nltk

import json
import requests
from bs4 import BeautifulSoup
import html2text

import pika
import os

nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')
nltk.download('maxent_ne_chunker')
nltk.download('words')

def get_continuous_chunks(text):
    chunked = ne_chunk(pos_tag(word_tokenize(text)))
    prev = None
    continuous_chunk = []
    current_chunk = []

    for i in chunked:
        if type(i) == Tree:
            current_chunk.append(" ".join([token for token, pos in i.leaves()]))
        elif current_chunk:
            named_entity = " ".join(current_chunk)
            if named_entity not in continuous_chunk:
                continuous_chunk.append(named_entity)
                current_chunk = []
        else:
            continue
    if current_chunk:
        named_entity = " ".join(current_chunk)
        if named_entity not in continuous_chunk:
            continuous_chunk.append(named_entity)
            current_chunk = []
    return continuous_chunk

def get_text_from_url(url):
    r = requests.get(url)
    bs = BeautifulSoup(r.text, 'lxml')
    return bs.find(id='mainArticle').text

# connect to pika
# Access the CLODUAMQP_URL environment variable and parse it (fallback to localhost)
url = os.environ.get('CLOUDAMQP_URL', 'amqp://guest:guest@localhost:5672/%2f')
params = pika.URLParameters(url)
connection = pika.BlockingConnection(params)
channel = connection.channel() # start a channel
channel.queue_declare(queue='tasks') # queue for URL requests
channel.queue_declare(queue='ner') # queue for named entities

def callback(ch, method, properties, body):
    print(" [x] Received %r" % body)
    clean_text = get_text_from_url(body)
    r = get_continuous_chunks(clean_text)
    data = {'url': body, 'entities': r} 
    channel.basic_publish(exchange='',
                          routing_key='ner',
                          body=json.dumps(data))

  

channel.basic_consume(callback,
                      queue='tasks',
                      no_ack=True)

print(' [*] Waiting for URL requests:')
channel.start_consuming()
