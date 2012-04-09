# TO RUN UNIT TESTS:
# 1) Install python modules unittest2, nose, nosegae
# 2) In Terminal, navigate to the directory containing this Python file.
# 3) Run 'nosetests -v --with-gae'

import unittest
import string
import random
from main import *
from StringIO import StringIO
from google.appengine.api import memcache
from google.appengine.ext import db
from google.appengine.ext import testbed
from google.appengine.ext import webapp
from django.utils import simplejson as json

def random_string_generator(size=10, chars=string.ascii_uppercase + string.ascii_lowercase + string.digits):
	return ''.join(random.choice(chars) for x in range(size))

class APICardHandlerTestCase(unittest.TestCase):
	def setUp(self):
		self.testbed = testbed.Testbed()
		self.testbed.activate()
		self.testbed.init_datastore_v3_stub()

		topics = ['Demand and Supply', 'Monetary Economics', 'International Economics']
		levels = range(1,4) # 1,2,3

		# insert mock questions into the database
		for topic in topics:
			for level in levels:
				for num in range(5):
					card = Card(
						level = int(level),
						topic = topic,
						question_name = random_string_generator(),
						question_body = random_string_generator(),
						mcq_answers = [random_string_generator() for x in range(4)],
						question_type = 'mcq',
						num_correct_attempts = 0,
						num_wrong_attempts = 0
					)

					card.put()

	def tearDown(self):
		self.testbed.deactivate()

	def testCardReturnedWithId(self):
		handler = APICardHandler()
		response = webapp.Response()
		handler.initialize(webapp.Request({}), response)

		topic = "Demand and Supply"
		level = 3
		handler.get(topic, level)

		# check response object for the correct json
		output = json.loads(response.out.getvalue())

		# just take one and check
		self.assertIn('id', output[0])

	def testGetCardsWithTopicAndLevelForCorrectNumberOfReturnedCards(self):
		handler = APICardHandler()
		response = webapp.Response()
		handler.initialize(webapp.Request({}), response)

		topic = "Demand and Supply"
		level = 3
		handler.get(topic, level)

		# check response object for the correct json
		output = json.loads(response.out.getvalue())
		self.assertEqual(len(output), 5)

	def testGetCardsWithTopicAndLevelForConsistentTopic(self):
		handler = APICardHandler()
		response = webapp.Response()
		handler.initialize(webapp.Request({}), response)

		topic = "Demand and Supply"
		level = 3
		handler.get(topic, level)

		# check response object for the correct json
		output = json.loads(response.out.getvalue())
		topic_set = set()
		for card in output:
			topic_set.add(card['topic'])

		reference_set = set()
		reference_set.add(u'Demand and Supply')

		self.assertEqual(topic_set, reference_set)

	def testGetCardsWithTopicAndLevelForConsistentLevel(self):
		handler = APICardHandler()
		response = webapp.Response()
		handler.initialize(webapp.Request({}), response)

		topic = "Demand and Supply"
		level = 3
		handler.get(topic, level)

		# check response object for the correct json
		output = json.loads(response.out.getvalue())
		print output
		level_set = set()
		for card in output:
			level_set.add(card['level'])

		reference_set = set()
		reference_set.add(3)
		self.assertEqual(level_set, reference_set)

class APIPlayerHandlerTestCase(unittest.TestCase):
	def setUp(self):
		self.testbed = testbed.Testbed()
		self.testbed.activate()
		self.testbed.init_datastore_v3_stub()

		# set up a random facebook id
		self.facebook_id = random_string_generator()

		# insert a player object into datastore
		request = webapp.Request({
			"wsgi.input": StringIO(),
			"CONTENT_LENGTH": 0,
			"METHOD": "PUT",
			"PATH_INFO": "/api/player/" + self.facebook_id
		})

		response = webapp.Response()
		handler = APIPlayerHandler()
		handler.initialize(request, response)
		handler.put(self.facebook_id)

	def tearDown(self):
		self.testbed.deactivate()

	def testInsertPlayerEntity(self):
		# now check that there is this Player object in the datastore
		player = Player.all().filter('facebook_id', self.facebook_id).get()
		self.assertEqual(player.facebook_id, self.facebook_id)

	def testGetPlayerEntity(self):
		# check that the GET def returns correct json out
		handler = APIPlayerHandler()
		response = webapp.Response()
		handler.initialize(webapp.Request({}), response)

		handler.get(self.facebook_id)

		# check response object for the correct json
		output = json.loads(response.out.getvalue())
		reference = json.loads('{"cards_owned": [], "wins": 0, "losses": 0, "name": "", "facebook_id": "' + self.facebook_id + '"}')

		self.assertEqual(output, reference)


if __name__ == '__main__':
    unittest.main()


