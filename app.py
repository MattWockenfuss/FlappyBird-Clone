from typing import List, Tuple, Any

import sqlite3
from flask import Flask, render_template, request, jsonify, g
import tomllib




app = Flask(__name__)
app.config['DATABASE'] = 'leaderboard.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(app.config['DATABASE'])
    return db

def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()






settings_list = []
def load_settings(path):
    with open(path, 'rb') as f:
        data = tomllib.load(f)
    global settings_list
    settings_list = [
        ("targetPipeSpeed", str(data["targetPipeSpeed"])),
        ("distanceBetweenPipes", str(data["distanceBetweenPipes"])),
        ("gap", str(data["gap"])),

        ("effectFromGravity", str(data["effectFromGravity"])),
        ("maximumGravity", str(data["maximumGravity"])),
        ("effectFromJump", str(data["effectFromJump"])),
        ("minimumTicksBetweenJumps", str(data["minimumTicksBetweenJumps"])),

        ("bronzeThreshold", str(data["bronzeThreshold"])),
        ("silverThreshold", str(data["silverThreshold"])),
        ("goldThreshold", str(data["goldThreshold"])),
        ("platinumThreshold", str(data["platinumThreshold"]))
    ]
@app.route('/play')
def play():
    return render_template('play.html')


@app.route('/play/addtoleaderboard', methods=['POST'])
def addToLeaderboard():
    name = request.json[0]['name']  # gets the name of the person
    score = request.json[1]['score']  # and their score
    db = get_db()
    cursor = db.cursor()
    cursor.execute("INSERT INTO leaderboard (name, score) VALUES (\'" + name + "\', " + str(score) + ")")
    db.commit()
    db.close()
    print('Added ' + name + " who got " + str(score))
    response = {'message': 'New person added to leaderboard!'}
    return jsonify(response)


@app.route('/scoreboard')
def scoreboard():
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM leaderboard ORDER BY score DESC")
    
    
    counter = 0
    for x in cursor.fetchall():
        print(x)
    db.close()
    return render_template('scoreboard.html')


@app.route('/get-scores')
def get_scores():
    nitems = request.args.get('nitems', 2)
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT * FROM leaderboard ORDER BY score DESC limit ' + str(nitems))
    yeet_list = cursor.fetchall()
    print(yeet_list)
    db.close()
    return jsonify(yeet_list)



@app.route('/get-settings')
def get_settings():
    return jsonify(settings_list)



if __name__ == "__main__":
    load_settings("server_config.toml")
    app.run(host='0.0.0.0', port=5000, debug=True)
