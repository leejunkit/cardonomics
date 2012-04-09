#!/usr/bin/env python

import os
import string
import random
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.api import urlfetch
from google.appengine.ext.db import djangoforms
from django.utils import simplejson as json
import logging

def random_string_generator(size=10, chars=string.ascii_uppercase + string.ascii_lowercase + string.digits):
    return ''.join(random.choice(chars) for x in range(size))

class BetterRequestHandler(webapp.RequestHandler):
    def out(data, format='json', status_code=200):
        if not status_code == 200:
            self.error(status_code)

        if format == 'json':
            self.response.headers['Content-Type'] = 'application/json'
            self.response.out.write(json.dumps(data))
            return

        self.response.out.write(data)

class Referral(db.Model):
    """Models a referral code and its metadata used for tracking viral stuff"""
    referral_code = db.StringProperty()
    email_address = db.StringProperty()
    num_referrals = db.IntegerProperty(default=0)
    conversions_list = db.StringListProperty()
    shortened_url = db.StringProperty()

    def to_dict(self):
        return dict([(p, getattr(self, p)) for p in self.properties()])

    def get_shortened_referral_url(self, referral_code):
        url = 'https://www.googleapis.com/urlshortener/v1/url'
        payload = json.dumps({'longUrl': 'http://cardonomics.appspot.com/app/index.html#/nav/ref/' + referral_code})
        headers = {'Content-Type': 'application/json'}

        result = urlfetch.fetch(url, payload, 'POST', headers)
        if result.status_code == 200:
            return (json.loads(result.content))['id']
        else:
            return "(Error in shortening URL)"


class Card(db.Model):
    """Models an Economics question in the game"""
    level = db.IntegerProperty()
    topic = db.StringProperty()
    question_name = db.StringProperty()
    question_body = db.TextProperty()
    mcq_answers = db.StringListProperty()
    graph_data = db.TextProperty()
    question_type = db.StringProperty()
    num_correct_attempts = db.IntegerProperty()
    num_wrong_attempts = db.IntegerProperty()

    special_color = db.StringProperty()
    paypal_code = db.StringProperty()

    num_players_owned = db.IntegerProperty()

    def to_dict(self):
        return_dict = dict([(p, getattr(self, p)) for p in self.properties()])
        return_dict['id'] = self.key().id()
        return return_dict

class Player(db.Model):
    """Models a player in our game, with ID grabbed from Facebook"""
    facebook_id = db.StringProperty()
    wins = db.IntegerProperty()
    losses = db.IntegerProperty()
    cards_owned = db.StringListProperty()

    def to_dict(self):
        return_dict = dict([(p, getattr(self, p)) for p in self.properties()])
        return_dict['name'] = self.get_facebook_name()
        return return_dict

    def get_facebook_name(self):
        url = "http://graph.facebook.com/" + self.facebook_id
        result = urlfetch.fetch(url)
        if result.status_code == 200:
            return (json.loads(result.content))['name']
        else:
            return ""

class CreatePlayer(webapp.RequestHandler):
    def get(self):
        p = Player(facebook_id="695341783",wins=10,losses=1,cards_owned=[])
        p.put()
        self.response.out.write(json.dumps(p.to_dict()))


class CardForm(djangoforms.ModelForm):
    class Meta:
        model = Card


class AddQuestionHandler(webapp.RequestHandler):
    def get(self):
        template_values = {
            'form_template': CardForm()
        }
        path = os.path.join(os.path.dirname(__file__), 'views/add_question.html')
        self.response.out.write(template.render(path, template_values))

    def post(self):
        logging.error('in post method now')
        data = CardForm(data=self.request.POST)
        if data.is_valid():
            entity = data.save()
            entity.put()
            self.redirect('/')
        else:
            logging.error('form is invalid!')
            # reprint the form
            template_values = {
                'form_template': CardForm()
            }
            path = os.path.join(os.path.dirname(__file__), 'views/add_question.html')
            self.response.out.write(template.render(path, template_values))

class APIReferralHandler(webapp.RequestHandler):
    def post(self, email_address):
        if not email_address:
            email_address = json.loads(self.request.arguments()[0])[u'email_address']

        # check if this email already exists in the datastore
        q = db.GqlQuery("SELECT * FROM Referral WHERE email_address = :1", email_address)

        if q.get() is None:
            # generate a unique code
            while True:
                referral_code = random_string_generator(5)
                q = db.GqlQuery("SELECT * FROM Referral WHERE referral_code = :1", referral_code)
                if q.get() is None:
                    # insert the Referral object into the datastore
                    referral = Referral(referral_code=referral_code, email_address=email_address)
                    referral.shortened_url = referral.get_shortened_referral_url(referral_code)

                    referral.put()

                    # return the referral code to the user
                    self.response.headers['Content-Type'] = "application/json"
                    self.response.out.write(json.dumps(referral.to_dict()))
                    break

        else:
            self.error(403)
            self.response.headers['Content-Type'] = "application/json"
            self.response.out.write(json.dumps({'error': email_address + ' already exists.'}))

    def get(self, referral_code=None):
        email_address = self.request.get('email_address')

        if referral_code:
            # #remove %40 and turn into @
            # referral_code=referral_code.replace('%40', '@')
            q = db.GqlQuery("SELECT * FROM Referral WHERE referral_code = :1", referral_code)
            referral = q.get()

            if referral:
                self.response.headers['Content-Type'] = "application/json"
                self.response.out.write(json.dumps(referral.to_dict()))
            else:
                self.error(404)
                self.response.headers['Content-Type'] = "application/json"
                self.response.out.write(json.dumps({'error': referral_code + ' does not exist.'}))

        elif email_address:
            # check email
            email_address = self.request.get('email_address')
            q = db.GqlQuery("SELECT * FROM Referral WHERE email_address = :1", email_address)
            referral = q.get()

            if referral:
                self.response.headers['Content-Type'] = "application/json"
                self.response.out.write(json.dumps(referral.to_dict()))
            else:
                self.error(404)
                self.response.headers['Content-Type'] = "application/json"
                self.response.out.write(json.dumps({'error': email_address + ' does not exist.'}))

        else:
            # just display all
            q = db.GqlQuery("SELECT * FROM Referral")
            referrals = q.fetch(20)

            self.response.out.write(json.dumps([referral.to_dict() for referral in referrals]))



class APIReferralIncrementHandler(webapp.RequestHandler):
    # this method simply increments the referral count of this email address
    def get(self, referral_code):
        q = db.GqlQuery("SELECT * FROM Referral WHERE referral_code = :1", referral_code)
        referral = q.get()

        if referral:
            referral.num_referrals = referral.num_referrals + 1
            referral.put()
            self.response.headers['Content-Type'] = "application/json"
            self.response.out.write(json.dumps(referral.to_dict()))
        else:
            self.response.headers['Content-Type'] = "application/json"
            self.response.out.write(json.dumps({'error': referral_code + ' does not exist.'}))

    # this method adds a new email address key to the viral list of this email
    def post(self, referral_code):
        q = db.GqlQuery("SELECT * FROM Referral WHERE referral_code = :1", referral_code)
        referral = q.get()
        if referral:
            new_email_address = self.request.get('new_email_address')
            #print new_email_address
            if not len(new_email_address) == 0:
                conversion_list = referral.conversions_list

                if not new_email_address in conversion_list:
                    conversion_list.append(new_email_address)
                    referral.conversions_list = conversion_list

                    referral.put()
                    self.response.headers['Content-Type'] = "application/json"
                    self.response.out.write(json.dumps(referral.to_dict()))
                else:
                    self.error(403)
                    self.response.headers['Content-Type'] = "application/json"
                    self.response.out.write(json.dumps({'error': 'This new_email_address has already been converted by this user.'}))

            else:
                self.error(403)
                self.response.headers['Content-Type'] = "application/json"
                self.response.out.write(json.dumps({'error': 'new_email_address POST data does not exist.'}))

        else:
            self.response.headers['Content-Type'] = "application/json"
            self.response.out.write(json.dumps({'error': referral_code + ' does not exist.'}))



class APICardHandler(BetterRequestHandler):
    def get(self, card_id=None):
        """This method returns cards in JSON, filtered by topic and level"""
        if card_id:
            the_card = db.Model.get(db.Key.from_path('Card', int(card_id)))
            if the_card:
                self.response.headers['Content-Type'] = "application/json"
                self.response.out.write(json.dumps(the_card.to_dict()))
            else:
                self.error(404)

        else:
            topic = self.request.get('topic')
            level = self.request.get('level')
            limit = int(self.request.get('limit'))

            if not topic and not level and not limit:
                limit = 100;
                q = db.GqlQuery("SELECT * FROM Card");
            
            else:
                q = db.GqlQuery("SELECT * FROM Card WHERE topic = :1 AND level = :2", topic, level)
            cards = q.fetch(limit)
            self.response.headers['Content-Type'] = "application/json"
            self.response.out.write(json.dumps([card.to_dict() for card in cards]))

    def post(self,card_id=None):
        """This method creates a new card if there is no card_id, or updates the card data, given the card_id"""
        card_POST_data = json.loads(self.request.arguments()[0])
        card_id = card_POST_data[u'id']

        if card_id:
            the_card = db.Model.get(db.Key.from_path('Card', int(card_id)))
            if the_card:
                the_card.num_players_owned = card_POST_data[u'num_players_owned']
                the_card.special_color = card_POST_data[u'special_color']
                the_card.paypal_code = card_POST_data[u'paypal_code']
                the_card.num_correct_attempts = card_POST_data[u'num_correct_attempts']
                the_card.num_wrong_attempts = card_POST_data[u'num_wrong_attempts']

                the_card.put()
                self.response.out.write(json.dumps(the_card.to_dict()))
                self.response.headers['Content-Type'] = "application/json"
                #self.response.out.write(json.dumps({'success':1}))

        else:
            self.error(404)



class APIPlayerHandler(webapp.RequestHandler):
    def get(self, id):
        """This method returns player data in JSON, given the player's facebook_id as a parameter"""
        q = db.GqlQuery("SELECT * FROM Player WHERE facebook_id = :1", id)
        player = q.get()

        if player is None:
            self.error(404)
        else:
            self.response.headers['Content-Type'] = "application/json"
            self.response.out.write(json.dumps(player.to_dict()))

    def post(self, id):
        """This method either creates or updates a player's data, given the player's facebook_id"""
        q = Player.all().filter('facebook_id', id)
        player = q.get()

        if player:
            # player already exists, update player
            player_POST_data = json.loads(self.request.arguments()[0])
            player.wins = int(player_POST_data[u'wins'])
            player.losses = int(player_POST_data[u'losses'])
            player.cards_owned = player_POST_data[u'cards_owned']

        else:
            # create a new player
            player = Player(wins=0, losses=0, cards_owned=[], facebook_id=id)

        player.put()
        self.response.headers['Content-Type'] = "application/json"
        self.response.out.write(json.dumps({'success':1}))




class PaymentHandler(webapp.RequestHandler):
    def get(self):
        self.redirect("/payment/paypal/interface.py")

class AddCardHandler(webapp.RequestHandler):
    def get(self):
        cardid = self.request.get("cardid")
        #self.redirect("/app/index.html#/nav/success?cardid="+cardid)
        self.redirect("/app/index.html#/nav/deckworkshop")


class MainHandler(webapp.RequestHandler):
    def get(self):
        self.redirect("/app/index.html")

def main():
    routes = [
        ('/', MainHandler),
        ('/special', MainHandler),  #link for emailer
        ('/payment/', PaymentHandler),
        ('/player/create', CreatePlayer),
        ('/questions/create', AddQuestionHandler),
        ('/api/player/?(\d+)?', APIPlayerHandler),
        ('/api/cards/?(\d+)?', APICardHandler),
        ('/api/referrals/(\w+)/increment', APIReferralIncrementHandler),
        ('/api/referrals/?(.+)?', APIReferralHandler)
    ]
    application = webapp.WSGIApplication(routes, debug=True)

    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
