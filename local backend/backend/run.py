# from src import create_app

# if __name__ == '__main__':
#     create_app().run(debug=True, host='0.0.0.0', port='5001')

# import os
# import unittest

# from flask_migrate import Migrate, MigrateCommand
# from flask_script import Manager

from src import create_app

app = create_app('dev')
app.app_context().push()

# manager = Manager(app)

# migrate = Migrate(app, db)

# manager.add_command('db', MigrateCommand)

# @manager.command
# def run():
#     app.run()

# @manager.command
# def test():
#     """Runs the unit tests."""
#     tests = unittest.TestLoader().discover('app/test', pattern='test*.py')
#     result = unittest.TextTestRunner(verbosity=2).run(tests)
#     if result.wasSuccessful():
#         return 0
#     return 1

# if __name__ == '__main__':
#     manager.run()


if __name__ == '__main__':
    create_app('dev').run(debug=True, host='0.0.0.0', port='5000')
