from flask_sqlalchemy import SQLAlchemy

# Instancia única de SQLAlchemy, se inicializa de verdad en create_app()
# (app.py) con db.init_app(app). Separarlo en su propio archivo evita
# imports circulares entre app.py y models.py.
db = SQLAlchemy()
