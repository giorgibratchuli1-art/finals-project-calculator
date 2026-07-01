from flask import Flask, render_template, request, jsonify
import sqlite3
import datetime
import json

app = Flask(__name__)

# მონაცემთა ბაზის შექმნა
def init_db():
    conn = sqlite3.connect('calculations.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            calc_type TEXT,
            inputs TEXT,
            result TEXT,
            date TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# ბაზაში შენახვის ფუნქცია
def save_to_db(calc_type, inputs, result):
    conn = sqlite3.connect('calculations.db')
    c = conn.cursor()
    date_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    c.execute("INSERT INTO history (calc_type, inputs, result, date) VALUES (?, ?, ?, ?)",
              (calc_type, json.dumps(inputs), json.dumps(result), date_str))
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

# მთავარი კალკულაციის API
@app.route('/api/calculate', methods=['POST'])
def calculate():
    data = request.json
    calc_type = data.get('type')
    result = {}

    try:
        if calc_type == 'margin':
            price = float(data['price'])
            cost = float(data['cost'])
            profit = price - cost
            margin = (profit / price) * 100 if price > 0 else 0
            result = {'profit': round(profit, 2), 'margin': round(margin, 2)}
            
        elif calc_type == 'cac_ltv':
            marketing = float(data['marketing'])
            new_customers = float(data['new_customers'])
            apv = float(data['apv'])
            freq = float(data['freq'])
            lifespan = float(data['lifespan'])
            
            cac = marketing / new_customers if new_customers > 0 else 0
            ltv = apv * freq * lifespan
            ratio = ltv / cac if cac > 0 else 0
            result = {'cac': round(cac, 2), 'ltv': round(ltv, 2), 'ratio': round(ratio, 2)}
            
        elif calc_type == 'inventory':
            cogs = float(data['cogs'])
            avg_inv = float(data['avg_inv'])
            daily_usage = float(data['daily_usage'])
            lead_time = float(data['lead_time'])
            
            turnover = cogs / avg_inv if avg_inv > 0 else 0
            reorder_point = daily_usage * lead_time
            result = {'turnover': round(turnover, 2), 'reorder_point': round(reorder_point, 2)}
            
        elif calc_type == 'employee':
            salary = float(data['salary'])
            benefits = float(data['benefits'])
            taxes = float(data['taxes'])
            overhead = float(data['overhead'])
            
            total = salary + benefits + taxes + overhead
            result = {'total_cost': round(total, 2)}

        save_to_db(calc_type, data, result)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# ბაზიდან ისტორიის ამოღების API
@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        conn = sqlite3.connect('calculations.db')
        c = conn.cursor()
        c.execute("SELECT id, calc_type, result, date FROM history ORDER BY id DESC LIMIT 15")
        rows = c.fetchall()
        conn.close()
        
        history_list = []
        for row in rows:
            history_list.append({
                'id': row[0],
                'calc_type': row[1],
                'result': json.loads(row[2]),
                'date': row[3]
            })
        return jsonify({'success': True, 'data': history_list})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)