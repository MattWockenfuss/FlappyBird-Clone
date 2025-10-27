import sqlite3
con = sqlite3.connect("leaderboard.db")

cur = con.cursor()
name = 'bobby'
score = 39
cur.execute("DELETE FROM leaderboard")
cur.execute("INSERT INTO leaderboard (name, score) VALUES (\'" + name + "\', " + str(score) + ")")
cur.execute("SELECT * FROM leaderboard ORDER BY score DESC")
con.commit()
print(cur.fetchall())