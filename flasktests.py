import os
import view
import unittest
import tempfile

class ViewTestCase(unittest.TestCase):

    def setUp(self):
        self.db_fd, view.app.config['DATABASE'] = tempfile.mkstemp()
        view.app.config['TESTING'] = True
        self.app = view.app.test_client()
        view.init_db()

    def tearDown(self):
        os.close(self.db_fd)
        os.unlink(view.app.config['DATABASE'])

def test_empty_db(self):
    rv = self.app.get('/')

if __name__ == '__main__':
    unittest.main()