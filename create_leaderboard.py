import sqlite3
con = sqlite3.connect("leaderboard.db")

cur = con.cursor()
cur.execute("CREATE TABLE leaderboard(name, score)")
print('Created \'leaderboard\' successfully!')