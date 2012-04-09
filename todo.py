#!/usr/bin/env python
from google.appengine.ext import db
from google.appengine.ext import webapp
from django.utils import simplejson as json

class Todo(db.Model):
	title = db.StringProperty()
	done = db.StringProperty(choices=set(["on", "off"]))
	category = db.StringProperty()

	def to_dict(self):
		the_dict = dict([(p, getattr(self, p)) for p in self.properties()])
		the_dict['id'] = self.key().id()

		return the_dict

class TodoCount(webapp.RequestHandler):
	def get(self):
		self.response.out.write(json.dumps({'count': Todo.all().count()}))

class TodoGetAndPost(webapp.RequestHandler):
	def get(self):
		category = self.request.get('category')
		todo_id = self.request.get('id')

		if category:
			query = db.GqlQuery('SELECT * FROM Todo WHERE category = :1', category)
			todos = query.fetch(100)
			result = [todo.to_dict() for todo in todos]

		elif todo_id:
			result = db.Model.get(db.Key.from_path('Todo', int(todo_id))).to_dict()

		else:
			todos = Todo.all().fetch(100)
			result = [todo.to_dict() for todo in todos]

		self.response.out.write(json.dumps(result))

	def post(self):
		todo_id = self.request.get('id')
		
		if todo_id:
			# this is an update to an existing todo
			todo = db.Model.get(db.Key.from_path('Todo', int(todo_id)))
			todo.title = self.request.get('title')
			todo.done = self.request.get('done')
			todo.category = self.request.get('category')

			action = 'update'

		else:
			# this is a new todo
			todo = Todo(
				title=self.request.get('title'),
				done=self.request.get('done'),
				category=self.request.get('category')
			)

			action = 'create'

		todo_key = todo.put()
		self.response.out.write(json.dumps({'id': todo_key.id(), action: 'success'}))

class TodoDeleteAll(webapp.RequestHandler):
	def post(self):
		for todo in Todo.all().fetch(100):
			todo.delete()

		self.response.out.write(json.dumps({'delete': 'success'}))

class TodoDeleteById(webapp.RequestHandler):
	def post(self):
		todo_id = self.request.get('id')
		todo = db.Model.get(db.Key.from_path('Todo', int(todo_id)))
		todo.delete()

		self.response.out.write(json.dumps({'delete': 'success'}))

todo_routes = [
	('/api/todo/count', TodoCount),
	('/api/todo', TodoGetAndPost),
	('/api/todo/delete_all', TodoDeleteAll),
	('/api/todo/delete', TodoDeleteById)
]

# the usual Python WSCGI code goes here...