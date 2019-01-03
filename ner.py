import json
import pika
import os

from dotenv import load_dotenv
load_dotenv()

# dynamically load NER implementation
ner_impl = os.getenv('NER')
if ner_impl == 'opencalais':
    print("Using opencalais for NER")
    from opencalais_ner import get_entities
else:
    print("Using NLTK for NER")
    from nltk_ner import get_entities

# connect to pika
# Access the CLODUAMQP_URL environment variable and parse it (fallback to localhost)
url = os.environ.get('CLOUDAMQP_URL', 'amqp://guest:guest@localhost:5672/%2f')
params = pika.URLParameters(url)
connection = pika.BlockingConnection(params)
channel = connection.channel() # start a channel
channel.queue_declare(queue='text') # queue for text extracts
channel.queue_declare(queue='ner') # queue for named entities

def callback(ch, method, properties, body):
    print(" [x] Received text extract")
    data = json.loads(body.decode('utf-8'))
    entities = get_entities(data['text'])
    data = {'url': data['url'], 'entities': entities} 
    channel.basic_publish(exchange='',
                          routing_key='ner',
                          body=json.dumps(data))


channel.basic_consume(callback,
                      queue='text',
                      no_ack=True)

print(' [*] Waiting for text extracts:')
channel.start_consuming()
