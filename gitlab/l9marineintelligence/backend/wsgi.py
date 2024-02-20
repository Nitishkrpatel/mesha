from src import create_app

app = create_app('dev')
app.app_context().push()


if __name__ == '__main__':
    create_app('dev').run(debug=True, host='0.0.0.0', port='5000')
