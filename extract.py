import json
import requests
from bs4 import BeautifulSoup

import pika
import os

def get_text_from_url(url):
    r = requests.get(url)
    bs = BeautifulSoup(r.text, 'lxml')
    main_article = bs.find(id='mainArticle')
    if main_article:
        return main_article.text
    return ''

# connect to pika
# Access the CLODUAMQP_URL environment variable and parse it (fallback to localhost)
url = os.environ.get('CLOUDAMQP_URL', 'amqp://guest:guest@localhost:5672/%2f')
params = pika.URLParameters(url)
connection = pika.BlockingConnection(params)
channel = connection.channel() # start a channel
channel.queue_declare(queue='tasks') # queue for URL requests
channel.queue_declare(queue='text') # queue for named entities

def callback(ch, method, properties, body):
    print(" [x] Received %r" % body)
    url = body.decode('utf-8')
    clean_text = get_text_from_url(url)
    print("Text from URL: %r" % clean_text)
    data = {'url': url, 'text': clean_text} 
    channel.basic_publish(exchange='',
                          routing_key='text',
                          body=json.dumps(data))

  

channel.basic_consume(callback,
                      queue='tasks',
                      no_ack=True)

print(' [*] Waiting for URL requests:')
channel.start_consuming()
