// 1. თაბების გადართვის ფუნქცია (საიდბარის ღილაკებისთვის)
function openTab(tabId, btn) {
    // გადავმალოთ ყველა თაბის კონტენტი
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));

    // აქტიური გავხადოთ ის თაბი, რომელსაც დავაჭირეთ
    document.getElementById(tabId).classList.add('active');

    // მოვაშოროთ active კლასი საიდბარის ყველა ღილაკს
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => button.classList.remove('active'));

    // გავააქტიუროთ მიმდინარე ღილაკი
    btn.classList.add('active');
}

// 2. გამოთვლების და API-სთან კავშირის ფუნქცია
function calculate(event, type) {
    event.preventDefault(); // ფორმის სტანდარტული რეფრეშის გათიშვა

    let payload = { type: type };
    let resultBoxId = '';

    // HTML ინპუტებიდან მონაცემების შეგროვება Python-ის მოთხოვნების შესაბამისად
    if (type === 'margin') {
        payload.price = parseFloat(document.getElementById('m_price').value);
        payload.cost = parseFloat(document.getElementById('m_cost').value);
        resultBoxId = 'res_margin';
    } 
    else if (type === 'cac_ltv') {
        payload.marketing = parseFloat(document.getElementById('c_marketing').value);
        payload.new_customers = parseFloat(document.getElementById('c_new_customers').value);
        payload.apv = parseFloat(document.getElementById('c_apv').value);
        payload.freq = parseFloat(document.getElementById('c_freq').value);
        payload.lifespan = parseFloat(document.getElementById('c_lifespan').value);
        resultBoxId = 'res_cac_ltv';
    } 
    else if (type === 'inventory') {
        payload.cogs = parseFloat(document.getElementById('i_cogs').value);
        payload.avg_inv = parseFloat(document.getElementById('i_avg_inv').value);
        payload.daily_usage = parseFloat(document.getElementById('i_daily').value); // აკავშირებს Python-ის daily_usage-თან
        payload.lead_time = parseFloat(document.getElementById('i_lead').value); // აკავშირებს Python-ის lead_time-თან
        resultBoxId = 'res_inventory';
    } 
    else if (type === 'employee') {
        payload.salary = parseFloat(document.getElementById('e_salary').value);
        payload.benefits = parseFloat(document.getElementById('e_benefits').value);
        payload.taxes = parseFloat(document.getElementById('e_taxes').value);
        payload.overhead = parseFloat(document.getElementById('e_overhead').value);
        resultBoxId = 'res_employee';
    }

    // მონაცემების გაგზავნა Flask ბექენდში
    fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(res => {
        const resBox = document.getElementById(resultBoxId);
        resBox.style.display = 'block';

        if (res.success) {
            // ვიზუალური პასუხის ფორმირება კალკულატორის ტიპის მიხედვით
            if (type === 'margin') {
                resBox.innerHTML = `<strong>წმინდა მოგება:</strong> ${res.data.profit} ₾ <br> <strong>მომგებიანობის მარჟა:</strong> ${res.data.margin}%`;
            } else if (type === 'cac_ltv') {
                resBox.innerHTML = `<strong>CAC (მოზიდვის ფასი):</strong> ${res.data.cac} ₾ <br> <strong>LTV (კლიენტის ღირებულება):</strong> ${res.data.ltv} ₾ <br> <strong>LTV:CAC პროპორცია:</strong> ${res.data.ratio}`;
            } else if (type === 'inventory') {
                resBox.innerHTML = `<strong>მარაგების ბრუნვადობა:</strong> ${res.data.turnover} <br> <strong>შეკვეთის ოპტიმალური წერტილი (Reorder Point):</strong> ${res.data.reorder_point} ერთეული`;
            } else if (type === 'employee') {
                resBox.innerHTML = `<strong>თანამშრომლის სრული დანახარჯი კომპანიისთვის:</strong> ${res.data.total_cost} ₾`;
            }
        } else {
            resBox.innerHTML = `<span style="color: red;">შეცდომა: ${res.error}</span>`;
        }
    })
    .catch(err => {
        console.error("კავშირის შეცდომა:", err);
    });
}

// 3. SQLite ბაზიდან ისტორიის წამოღების ფუნქცია
function loadHistory() {
    fetch('/api/history')
    .then(response => response.json())
    .then(res => {
        if (res.success) {
            const tbody = document.getElementById('history-tbody');
            tbody.innerHTML = ''; // ძველი მონაცემების გასუფთავება

            res.data.forEach(row => {
                let resultText = JSON.stringify(row.result).replace(/[{""}]/g, ' '); // ლამაზი ტექსტისთვის
                
                let tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${row.id}</td>
                    <td><span class="badge">${row.calc_type.toUpperCase()}</span></td>
                    <td>${resultText}</td>
                    <td>${row.date}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    });
}