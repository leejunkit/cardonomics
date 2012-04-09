import unittest
import string
import random
import urllib
from main import *
from StringIO import StringIO
from google.appengine.api import memcache
from google.appengine.ext import db
from google.appengine.ext import testbed
from google.appengine.ext import webapp
from django.utils import simplejson as json
import logging

def random_string_generator(size=10, chars=string.ascii_uppercase + string.ascii_lowercase + string.digits):
    return ''.join(random.choice(chars) for x in range(size))

class APIABHandlerTestCase(unittest.TestCase):
    def setUp(self):
        self.testbed = testbed.Testbed()
        self.testbed.activate()
        self.testbed.init_datastore_v3_stub()

        self.abBuildQuestionA = ABBuildQuestion(
            page_id = 0,
            num_visits = 10,
            num_success = 10
        )
        self.abBuildQuestionA.put()

        self.abBuildQuestionB = ABBuildQuestion(
            page_id = 1,
            num_visits = 15,
            num_success = 15
        )
        self.abBuildQuestionB.put()


    def tearDown(self):
        self.testbed.deactivate()

    def testGetABBuildQuestionWithPageIDFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "GET",
            "PATH_INFO": "/api/ABTest/"+ str(self.abBuildQuestionB.page_id)
        })
        response = webapp.Response()
        handler = APIABHandler()
        handler.initialize(request, response)
        handler.get(str(self.abBuildQuestionB.page_id))
        output = json.loads(response.out.getvalue())
        self.assertEqual(self.abBuildQuestionB.num_visits,output['num_visits'])

    def testPostABBuildQuestionWithPageIDFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "POST",
            "PATH_INFO": "/api/ABTest/"+ str(self.abBuildQuestionB.page_id)
        })
        request.query_string = json.dumps(self.abBuildQuestionB.to_dict())
        response = webapp.Response()
        handler = APIABHandler()
        handler.initialize(request, response)
        handler.post(str(self.abBuildQuestionB.page_id))
        abBuildQuestion = ABBuildQuestion.all().filter('page_id', 1).get()
        self.assertEqual(abBuildQuestion.page_id, 1)

    def testPostABBuildQuestionWithPageIDNotFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "POST",
            "PATH_INFO": "/api/ABTest/"+ str(3)
        })
        request.query_string = json.dumps(self.abBuildQuestionB.to_dict())
        response = webapp.Response()
        handler = APIABHandler()
        handler.initialize(request, response)
        handler.post(str(3))
        abBuildQuestion = ABBuildQuestion.all().filter('page_id', 3).get()
        self.assertEqual(abBuildQuestion.page_id, 3)


class APIMultiplayerHandlerTestCase(unittest.TestCase):
    def setUp(self):
        self.testbed = testbed.Testbed()
        self.testbed.activate()
        self.testbed.init_datastore_v3_stub()

        multiplayerGame = MultiplayerGame(
            player_one_fb_id = random_string_generator(),
            player_two_fb_id = random_string_generator(),
            player_one_cards = [random_string_generator()],
            player_two_cards = [random_string_generator()],
            player_one_time = random.uniform(0.1,2),
            player_two_time = random.uniform(0.1,2),
        )
        multiplayerGame.put()
        self.multiplayerGame_dict = multiplayerGame.to_dict()
        self.multiplayerGame_id = self.multiplayerGame_dict['id']

    def tearDown(self):
        self.testbed.deactivate()

    def testGetMultiplayerGameWithGameIDFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "GET",
            "PATH_INFO": "/api/multiplayergame/"+ str(self.multiplayerGame_id)
        })
        response = webapp.Response()
        handler = APIMultiplayerHandler()
        handler.initialize(request, response)
        handler.get(str(self.multiplayerGame_id))
        output = json.loads(response.out.getvalue())
        self.assertEqual(self.multiplayerGame_dict['id'],output['id'])

    def testPostMultiplayerGameWithNoGameID(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "POST",
            "PATH_INFO": "/api/multiplayergame/"
        })
        request.query_string = json.dumps(self.multiplayerGame_dict)
        response = webapp.Response()
        handler = APIMultiplayerHandler()
        handler.initialize(request, response)
        handler.post()
        output = json.loads(response.out.getvalue())
        self.assertNotEqual(output['id'],self.multiplayerGame_id)

    def testPostMultiplayerGameWithWithGameIDFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "POST",
            "PATH_INFO": "/api/multiplayergame/"+ str(self.multiplayerGame_id)
        })
        request.query_string = json.dumps(self.multiplayerGame_dict)
        response = webapp.Response()
        handler = APIMultiplayerHandler()
        handler.initialize(request, response)
        handler.post(str(self.multiplayerGame_id))
        output = json.loads(response.out.getvalue())
        self.assertEqual(output['id'],self.multiplayerGame_id)

class APIReferralHandlerTestCase(unittest.TestCase):
    def setUp(self):
        self.testbed = testbed.Testbed()
        self.testbed.activate()
        self.testbed.init_datastore_v3_stub()

        self.email_addresses = ['jia.luo.2010@sis.smu.edu.sg','xy.peh.2010@sis.smu.edu.sg',
                        'junkit.lee.2008@economics.smu.edu.sg','junhao.peh.2010@sis.smu.edu.sg']
        self.referral_codes = [random_string_generator(),random_string_generator(),random_string_generator(),random_string_generator()]

        i = 0
        for email_address in self.email_addresses:
            referral = Referral(
                email_address = email_address,
                referral_code = self.referral_codes[i]
            )
            referral.put()
            i+=1

    def tearDown(self):
        self.testbed.deactivate()

    def testGetReferralCodeWithReferralCodeFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "GET",
            "PATH_INFO": "/api/referrals/"+ self.referral_codes[1] 
        })
        response = webapp.Response()
        handler = APIReferralHandler()
        handler.initialize(request, response)
        handler.get(self.referral_codes[1])
        output = json.loads(response.out.getvalue())

        self.assertEqual(self.email_addresses[1],output['email_address'])

    def testGetReferralWithReferralCodeNotFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "GET",
            "PATH_INFO": "/api/referrals/abcd"
        })
        response = webapp.Response()
        handler = APIReferralHandler()
        handler.initialize(request, response)
        handler.get("abcd")
        output = json.loads(response.out.getvalue())

        self.assertEqual(output, {'error': 'abcd does not exist.'})

    def testGetReferralWithEmailAddressFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "GET",
            "PATH_INFO": "/api/referrals/"
        })
        request.query_string = 'email_address=jia.luo.2010@sis.smu.edu.sg'
        response = webapp.Response()
        handler = APIReferralHandler()
        handler.initialize(request, response)
        handler.get()
        output = json.loads(response.out.getvalue())

        self.assertEqual(self.referral_codes[0],output['referral_code'])

    def testGetReferralWithEmailAddressNotFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "GET",
            "PATH_INFO": "/api/referrals/"
        })
        request.query_string = 'email_address=haha@gmail.com'
        response = webapp.Response()
        handler = APIReferralHandler()
        handler.initialize(request, response)
        handler.get()
        output = json.loads(response.out.getvalue())

        self.assertEqual(output, {'error': 'haha@gmail.com does not exist.'})

    def testGetReferralWithNoParameter(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "GET",
            "PATH_INFO": "/api/referrals/"
        })
        response = webapp.Response()
        handler = APIReferralHandler()
        handler.initialize(request, response)
        handler.get()
        output = json.loads(response.out.getvalue())

        value = False
        for out in output:
            if self.referral_codes[1] == out['referral_code']:
                value = True
        self.assertTrue(value)

    def testPostReferralWithEmailAddressNotFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "POST",
            "PATH_INFO": "/api/referrals/haha@gmail.com"
        })
        response = webapp.Response()
        handler = APIReferralHandler()
        handler.initialize(request, response)
        handler.post("haha@gmail.com")
        output = json.loads(response.out.getvalue())

        value = False
        if "haha@gmail.com" == output['email_address']:
                value = True
        self.assertTrue(value)

    def testPostReferralWithEmailAddressFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "POST",
            "PATH_INFO": "/api/referrals/"+self.email_addresses[1]
        })
        response = webapp.Response()
        handler = APIReferralHandler()
        handler.initialize(request, response)
        handler.post(self.email_addresses[1])
        output = json.loads(response.out.getvalue())

        self.assertEqual(output, {'error': self.email_addresses[1] + ' already exists.'})

class APIReferralIncrementHandlerTestCase(unittest.TestCase):
    def setUp(self):
        self.testbed = testbed.Testbed()
        self.testbed.activate()
        self.testbed.init_datastore_v3_stub()

        self.email_addresses = ['jia.luo.2010@sis.smu.edu.sg','xy.peh.2010@sis.smu.edu.sg',
                        'junkit.lee.2008@economics.smu.edu.sg','junhao.peh.2010@sis.smu.edu.sg']
        self.referral_codes = [random_string_generator(),random_string_generator(),random_string_generator(),random_string_generator()]
        self.num_referralsList = [random.randint(0,100),random.randint(0,100),random.randint(0,100),random.randint(0,100)]

        i = 0
        for referral_code in self.referral_codes:
            referral = Referral(
                referral_code = referral_code,
                conversions_list = [self.email_addresses[i]],
                num_referrals = self.num_referralsList[i]
            )
            referral.put()
            i+=1

    def tearDown(self):
        self.testbed.deactivate()

    def testGetIncrementalReferralWithReferralCodeFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "GET",
            "PATH_INFO": "/api/referrals/"+self.referral_codes[1]+"/increment"
        })
        response = webapp.Response()
        handler = APIReferralIncrementHandler()
        handler.initialize(request, response)
        handler.get(self.referral_codes[1])
        output = json.loads(response.out.getvalue())
        self.assertEqual(self.num_referralsList[1]+1, output["num_referrals"])

    def testGetIncrementalReferralWithReferralCodeNotFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "GET",
            "PATH_INFO": "/api/referrals/abcd/increment"
        })
        response = webapp.Response()
        handler = APIReferralIncrementHandler()
        handler.initialize(request, response)
        handler.get("abcd")
        output = json.loads(response.out.getvalue())
        self.assertEqual(output, {'error': 'abcd does not exist.'})

    def testPostIncrementalReferralWithReferralCodeNotFoundNewEmailAdd(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "POST",
            "PATH_INFO": "/api/referrals/"+self.referral_codes[1]+"/increment"
        })
        request.query_string = 'new_email_address=haha@gmail.com'
        response = webapp.Response()
        handler = APIReferralIncrementHandler()
        handler.initialize(request, response)
        handler.post(self.referral_codes[1])
        output = json.loads(response.out.getvalue())
        self.assertTrue("haha@gmail.com" in output["conversions_list"])

    def testPostIncrementalReferralWithReferralCodeNotFoundExistingEmailAdd(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "POST",
            "PATH_INFO": "/api/referrals/"+self.referral_codes[1]+"/increment"
        })
        request.query_string = 'new_email_address=xy.peh.2010@sis.smu.edu.sg'
        response = webapp.Response()
        handler = APIReferralIncrementHandler()
        handler.initialize(request, response)
        handler.post(self.referral_codes[1])
        output = json.loads(response.out.getvalue())
        self.assertEqual(output,{'error': 'This new_email_address has already been converted by this user.'})
    
    def testPostIncrementalReferralWithReferralCodeNotFoundNoEmailAdd(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "POST",
            "PATH_INFO": "/api/referrals/"+self.referral_codes[1]+"/increment"
        })
        #request.query_string = 'new_email_address=haha@gmail.com'
        response = webapp.Response()
        handler = APIReferralIncrementHandler()
        handler.initialize(request, response)
        handler.post(self.referral_codes[1])
        output = json.loads(response.out.getvalue())
        self.assertEqual(output,{'error': 'new_email_address POST data does not exist.'})

    def testPostIncrementalReferralWithReferralCodeNotFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "POST",
            "PATH_INFO": "/api/referrals/"+self.referral_codes[1]+"/increment"
        })
        response = webapp.Response()
        handler = APIReferralIncrementHandler()
        handler.initialize(request, response)
        handler.post("abcd")
        output = json.loads(response.out.getvalue())
        self.assertEqual(output,{'error': 'abcd does not exist.'})

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
                        limit = random.randint(5,10),
                        question_name = random_string_generator(),
                        question_body = random_string_generator(),
                        mcq_answers = [random_string_generator() for x in range(4)],
                        question_type = 'mcq',
                        num_correct_attempts = 0,
                        num_wrong_attempts = 0
                    )
                    card.put()
                    card_dict = card.to_dict()
                    self.the_id = card_dict['id']

    def tearDown(self):
        self.testbed.deactivate()

    def testGetCardReturnedWithNoParameter(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "GET",
            "PATH_INFO": "/api/cards"
        })
        request.query_string = 'level=3&topic=Demand and Supply&limit=10'
        response = webapp.Response()
        handler = APICardHandler()
        handler.initialize(request, response)
        handler.get()
        output = json.loads(response.out.getvalue())

        topic_set = set()
        for card in output:
            topic_set.add(card['topic'])

        reference_set = set()
        reference_set.add(u'Demand and Supply')

        self.assertEqual(topic_set, reference_set)

    def testGetCardReturnedWithCardIdFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "GET",
            "PATH_INFO": "/api/cards"
        })
        response = webapp.Response()
        handler = APICardHandler()
        handler.initialize(request, response)
        handler.get(self.the_id)
        output = json.loads(response.out.getvalue())
        self.assertEqual(self.the_id, output['id'])

    def testPostCardsWithCardIdFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "POST",
            "PATH_INFO": "/api/cards/1"
        })
        request.query_string = '{"num_players_owned":3, "graph_data": "None", "paypal_code": "X6B44SQ9WXJP2", "level": 1, "question_name": "Law of Demand", "question_body": "The law of demand indicates that as price falls,", "id":' + str(self.the_id) + ', "topic": "Demand and Supply", "num_wrong_attempts": 6, "question_type": "mcq", "num_correct_attempts": 10, "mcq_answers": ["the quantity demanded rises.", "demand rises.", "demand falls.", "the quantity demanded falls. "], "special_color": "Gold", "graph_answer": "None"}'
        response = webapp.Response()
        handler = APICardHandler()
        handler.initialize(request, response)
        handler.post()
        output = json.loads(response.out.getvalue())
        self.assertEqual(self.the_id, output['id'])


class APIPlayerHandlerTestCase(unittest.TestCase):
    def setUp(self):
        self.testbed = testbed.Testbed()
        self.testbed.activate()
        self.testbed.init_datastore_v3_stub()

        # set up a random facebook id
        #self.facebook_id = random_string_generator()
        self.facebook_ids = [random_string_generator(),random_string_generator(),random_string_generator(),random_string_generator()]
        for facebook_id in self.facebook_ids:
                player = Player(
                        facebook_id = facebook_id,
                        wins = random.randint(0,100),
                        losses = random.randint(0,100),
                )
                player.put()

        # insert a player object into datastore

    def tearDown(self):
        self.testbed.deactivate()

    def testGetPlayerEntityWithFacebookIdFound(self):
        # check that the GET def returns correct json out
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "GET",
            "PATH_INFO": "/api/player/" + self.facebook_ids[1]
        })
        response = webapp.Response()
        handler = APIPlayerHandler()
        handler.initialize(request, response)
        handler.get(self.facebook_ids[1])

        # check response object for the correct json
        output = json.loads(response.out.getvalue())
        self.assertTrue(output['facebook_id'],self.facebook_ids[1])

    def testPostPlayerEntityWithFacebookIdFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "POST",
            "PATH_INFO": "/api/player/" + self.facebook_ids[1]
        })
        
        request.query_string='{"wins": 5, "losses": 2, "cards_owned": []}'
        response = webapp.Response()
        handler = APIPlayerHandler()
        handler.initialize(request, response)
        handler.post(self.facebook_ids[1])

        # now check that there is this Player object in the datastore
        output = json.loads(response.out.getvalue())
        self.assertEqual(output,{'success':1})

    def testPostPlayerEntityWithFacebookIdNotFound(self):
        request = webapp.Request({
            "wsgi.input": StringIO(),
            "CONTENT_LENGTH": 0,
            "METHOD": "POST",
            "PATH_INFO": "/api/player/abcd"
        })
        response = webapp.Response()
        handler = APIPlayerHandler()
        handler.initialize(request, response)
        handler.post("abcd")

        # now check that there is this Player object in the datastore
        #player = Player.all().filter('facebook_id', 'abcd').get()
        #self.assertEqual(player.facebook_id, 'abcd')
        output = json.loads(response.out.getvalue())
        self.assertEqual(output,{'success':1})

    

