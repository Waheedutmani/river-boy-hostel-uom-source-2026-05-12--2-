#!/usr/bin/env python3
"""River Boy Hostel UOM - Lightweight Python Server"""
import json
import os
import base64
import sqlite3
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
from urllib.parse import urlparse, parse_qs
from datetime import datetime

DB_PATH = '/home/z/my-project/db/custom.db'
PROJECT_ROOT = '/home/z/my-project'
NEXT_DIR = os.path.join(PROJECT_ROOT, '.next')
PUBLIC_DIR = os.path.join(PROJECT_ROOT, 'public')

MIME_TYPES = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
    '.ttf': 'font/ttf', '.map': 'application/json'
}

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def row_to_dict(row):
    if row is None:
        return None
    return dict(row)

def rows_to_dict(rows):
    return [dict(r) for r in rows]

class HostelHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress logs to save memory

    def send_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def send_json(self, data, status=200):
        body = json.dumps(data, default=str).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_cors()
        self.send_header('Content-Length', len(body))
        self.end_headers()
        self.wfile.write(body)

    def send_file(self, filepath):
        if not os.path.exists(filepath):
            return False
        ext = os.path.splitext(filepath)[1]
        mime = MIME_TYPES.get(ext, 'application/octet-stream')
        with open(filepath, 'rb') as f:
            data = f.read()
        self.send_response(200)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', len(data))
        self.send_cors()
        if ext != '.html':
            self.send_header('Cache-Control', 'public, max-age=31536000')
        self.end_headers()
        self.wfile.write(data)
        return True

    def read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length > 0:
            raw = self.rfile.read(length)
            try:
                return json.loads(raw.decode())
            except:
                return {}
        return {}

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.pathname if hasattr(parsed, 'pathname') else parsed.path
        params = parse_qs(parsed.query)

        # API routes
        if path.startswith('/api/'):
            self.handle_api('GET', path, params, {})
            return

        # _next/image
        if path.startswith('/_next/image'):
            url_param = params.get('url', [''])[0]
            if url_param:
                clean = url_param.lstrip('/')
                fpath = os.path.join(PUBLIC_DIR, clean)
                if self.send_file(fpath):
                    return
            self.send_response(404)
            self.end_headers()
            return

        # _next/static
        if path.startswith('/_next/static/'):
            fpath = os.path.join(NEXT_DIR, path.replace('/_next/', ''))
            if self.send_file(fpath):
                return

        # Public files
        public_path = os.path.join(PUBLIC_DIR, path.lstrip('/'))
        if os.path.exists(public_path) and os.path.isfile(public_path):
            self.send_file(public_path)
            return

        # SPA - serve index.html for all other routes
        index_path = os.path.join(NEXT_DIR, 'server', 'app', 'index.html')
        if not self.send_file(index_path):
            self.send_response(404)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<h1>Not Found</h1>')

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.pathname if hasattr(parsed, 'pathname') else parsed.path
        params = parse_qs(parsed.query)
        body = self.read_body()
        if path.startswith('/api/'):
            self.handle_api('POST', path, params, body)
        else:
            self.send_json({'error': 'Not found'}, 404)

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.pathname if hasattr(parsed, 'pathname') else parsed.path
        params = parse_qs(parsed.query)
        body = self.read_body()
        if path.startswith('/api/'):
            self.handle_api('PUT', path, params, body)
        else:
            self.send_json({'error': 'Not found'}, 404)

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.pathname if hasattr(parsed, 'pathname') else parsed.path
        params = parse_qs(parsed.query)
        if path.startswith('/api/'):
            self.handle_api('DELETE', path, params, {})
        else:
            self.send_json({'error': 'Not found'}, 404)

    def handle_api(self, method, path, params, body):
        try:
            conn = get_db()
            cur = conn.cursor()

            # ===== AUTH LOGIN =====
            if path == '/api/auth/login' and method == 'POST':
                email = body.get('email', '')
                password = body.get('password', '')
                if not email or not password:
                    self.send_json({'error': 'Email and password required'}, 400)
                    conn.close(); return
                encoded_pw = base64.b64encode(password.encode()).decode()
                cur.execute('SELECT * FROM User WHERE email = ? AND password = ?', (email, encoded_pw))
                user = row_to_dict(cur.fetchone())
                if not user:
                    self.send_json({'error': 'Invalid email or password'}, 401)
                    conn.close(); return
                # Get student data
                cur.execute('''SELECT s.*, r.number as roomNumber, r.floor as roomFloor, r.capacity as roomCapacity, h.name as hostelName
                    FROM Student s LEFT JOIN Room r ON s.roomId = r.id LEFT JOIN Hostel h ON r.hostelId = h.id
                    WHERE s.userId = ?''', (user['id'],))
                student = row_to_dict(cur.fetchone())
                if student:
                    student['room'] = None
                    if student.get('roomNumber'):
                        student['room'] = {'id': student.get('roomId'), 'number': student['roomNumber'], 'floor': student['roomFloor'], 'capacity': student['roomCapacity'], 'hostel': {'name': student['hostelName']}}
                    for k in ['roomNumber', 'roomFloor', 'roomCapacity', 'hostelName']:
                        student.pop(k, None)
                del user['password']
                user['student'] = student
                self.send_json({'user': user})
                conn.close(); return

            # ===== AUTH REGISTER =====
            if path == '/api/auth/register' and method == 'POST':
                email = body.get('email', '')
                name = body.get('name', '')
                password = body.get('password', '')
                if not email or not name or not password:
                    self.send_json({'error': 'All fields required'}, 400)
                    conn.close(); return
                cur.execute('SELECT id FROM User WHERE email = ?', (email,))
                if cur.fetchone():
                    self.send_json({'error': 'Email already registered'}, 400)
                    conn.close(); return
                encoded_pw = base64.b64encode(password.encode()).decode()
                import uuid
                user_id = uuid.uuid4().hex[:25]
                now = datetime.now().isoformat()
                role = body.get('role', 'student')
                cur.execute('INSERT INTO User (id, email, password, name, role, phone, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    (user_id, email, encoded_pw, name, role, body.get('phone', ''), now, now))
                if role != 'admin':
                    stu_id = uuid.uuid4().hex[:25]
                    cur.execute('INSERT INTO Student (id, userId, rollNo, department, semester, bloodGroup, guardianName, guardianPhone, address, emergencyContact, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        (stu_id, user_id, body.get('rollNo', ''), body.get('department', ''), body.get('semester', 1), body.get('bloodGroup', ''), body.get('guardianName', ''), body.get('guardianPhone', ''), body.get('address', ''), body.get('emergencyContact', ''), 'Active', now, now))
                conn.commit()
                cur.execute('SELECT * FROM User WHERE id = ?', (user_id,))
                user = row_to_dict(cur.fetchone())
                del user['password']
                user['student'] = None
                self.send_json({'user': user}, 201)
                conn.close(); return

            # ===== AUTH UPDATE =====
            if path.startswith('/api/auth/') and method == 'PUT':
                uid = path.split('/')[-1]
                cur.execute('UPDATE User SET name = ?, phone = ?, updatedAt = ? WHERE id = ?',
                    (body.get('name', ''), body.get('phone', ''), datetime.now().isoformat(), uid))
                conn.commit()
                cur.execute('SELECT id, name, email, role, phone FROM User WHERE id = ?', (uid,))
                user = row_to_dict(cur.fetchone())
                self.send_json({'user': user})
                conn.close(); return

            # ===== DASHBOARD =====
            if path == '/api/dashboard' and method == 'GET':
                cur.execute('SELECT COUNT(*) as c FROM Student')
                totalStudents = cur.fetchone()['c']
                cur.execute('SELECT COUNT(*) as c FROM Student WHERE status = "Active"')
                activeStudents = cur.fetchone()['c']
                cur.execute('SELECT COUNT(*) as c FROM Room')
                totalRooms = cur.fetchone()['c']
                cur.execute('SELECT COUNT(*) as c FROM Complaint')
                totalComplaints = cur.fetchone()['c']
                cur.execute('SELECT COUNT(*) as c FROM Complaint WHERE status = "Open"')
                pendingComplaints = cur.fetchone()['c']
                cur.execute('SELECT COUNT(*) as c FROM Fee')
                totalFees = cur.fetchone()['c']
                cur.execute('SELECT COALESCE(SUM(amount), 0) as s FROM Fee WHERE status = "Paid"')
                collectedFees = cur.fetchone()['s']
                cur.execute('SELECT COALESCE(SUM(amount), 0) as s FROM Fee WHERE status = "Pending"')
                pendingFees = cur.fetchone()['s']
                self.send_json({
                    'totalStudents': totalStudents, 'activeStudents': activeStudents,
                    'totalRooms': totalRooms, 'totalComplaints': totalComplaints,
                    'pendingComplaints': pendingComplaints, 'totalFees': totalFees,
                    'collectedFees': collectedFees, 'pendingFees': pendingFees,
                    'recentComplaints': [], 'recentFees': [], 'occupancyData': []
                })
                conn.close(); return

            # ===== STUDENTS =====
            if path == '/api/students' and method == 'GET':
                cur.execute('''SELECT s.*, u.name as userName, u.email as userEmail, u.phone as userPhone,
                    r.number as roomNumber, h.name as hostelName
                    FROM Student s LEFT JOIN User u ON s.userId = u.id
                    LEFT JOIN Room r ON s.roomId = r.id LEFT JOIN Hostel h ON r.hostelId = h.id
                    LIMIT 100''')
                students = rows_to_dict(cur.fetchall())
                for s in students:
                    s['user'] = {'name': s.pop('userName', ''), 'email': s.pop('userEmail', ''), 'phone': s.pop('userPhone', '')}
                    s['room'] = None
                    if s.get('roomNumber'):
                        s['room'] = {'number': s.pop('roomNumber'), 'hostel': {'name': s.pop('hostelName', '')}}
                    else:
                        s.pop('roomNumber', None); s.pop('hostelName', None)
                self.send_json({'students': students})
                conn.close(); return

            if path == '/api/students' and method == 'POST':
                import uuid
                sid = uuid.uuid4().hex[:25]
                now = datetime.now().isoformat()
                cur.execute('INSERT INTO Student (id, userId, rollNo, department, semester, roomId, guardianName, guardianPhone, address, bloodGroup, emergencyContact, status, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                    (sid, body.get('userId',''), body.get('rollNo',''), body.get('department',''), body.get('semester',1), body.get('roomId'), body.get('guardianName'), body.get('guardianPhone'), body.get('address'), body.get('bloodGroup'), body.get('emergencyContact'), 'Active', now, now))
                conn.commit()
                self.send_json({'student': {'id': sid}}, 201)
                conn.close(); return

            if path.startswith('/api/students/') and method in ('PUT', 'PATCH'):
                sid = path.split('/')[-1]
                fields = []
                values = []
                for k in ['guardianName', 'guardianPhone', 'address', 'bloodGroup', 'emergencyContact', 'roomId', 'status']:
                    if k in body:
                        fields.append(f'{k} = ?')
                        values.append(body[k])
                if fields:
                    fields.append('updatedAt = ?')
                    values.append(datetime.now().isoformat())
                    values.append(sid)
                    cur.execute(f'UPDATE Student SET {", ".join(fields)} WHERE id = ?', values)
                    conn.commit()
                self.send_json({'success': True})
                conn.close(); return

            if path.startswith('/api/students/') and method == 'DELETE':
                sid = path.split('/')[-1]
                cur.execute('DELETE FROM Student WHERE id = ?', (sid,))
                conn.commit()
                self.send_json({'success': True})
                conn.close(); return

            # ===== ROOMS =====
            if path == '/api/rooms' and method == 'GET':
                detailed = params.get('detailed', [''])[0]
                if detailed:
                    cur.execute('''SELECT r.*, h.name as hostelName, h.type as hostelType,
                        (SELECT COUNT(*) FROM Student s WHERE s.roomId = r.id) as studentCount
                        FROM Room r LEFT JOIN Hostel h ON r.hostelId = h.id LIMIT 100''')
                else:
                    cur.execute('''SELECT r.*, h.name as hostelName, h.type as hostelType,
                        (SELECT COUNT(*) FROM Student s WHERE s.roomId = r.id) as studentCount
                        FROM Room r LEFT JOIN Hostel h ON r.hostelId = h.id LIMIT 100''')
                rooms = rows_to_dict(cur.fetchall())
                for r in rooms:
                    r['hostel'] = {'name': r.pop('hostelName', ''), 'type': r.pop('hostelType', '')}
                    r['_count'] = {'students': r.pop('studentCount', 0)}
                self.send_json({'rooms': rooms})
                conn.close(); return

            if path == '/api/rooms' and method == 'POST':
                import uuid
                rid = uuid.uuid4().hex[:25]
                now = datetime.now().isoformat()
                cur.execute('INSERT INTO Room (id, number, floor, capacity, hostelId, status, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?)',
                    (rid, body.get('number',''), body.get('floor',1), body.get('capacity',2), body.get('hostelId',''), body.get('status','Available'), now, now))
                conn.commit()
                self.send_json({'room': {'id': rid}}, 201)
                conn.close(); return

            if path.startswith('/api/rooms/') and method in ('PUT', 'PATCH'):
                rid = path.split('/')[-1]
                fields = []
                values = []
                for k in ['number', 'floor', 'capacity', 'hostelId', 'status']:
                    if k in body:
                        fields.append(f'{k} = ?')
                        values.append(body[k])
                if fields:
                    fields.append('updatedAt = ?')
                    values.append(datetime.now().isoformat())
                    values.append(rid)
                    cur.execute(f'UPDATE Room SET {", ".join(fields)} WHERE id = ?', values)
                    conn.commit()
                self.send_json({'success': True})
                conn.close(); return

            if path.startswith('/api/rooms/') and method == 'DELETE':
                rid = path.split('/')[-1]
                cur.execute('DELETE FROM Room WHERE id = ?', (rid,))
                conn.commit()
                self.send_json({'success': True})
                conn.close(); return

            # ===== HOSTELS =====
            if path == '/api/hostels' and method == 'GET':
                cur.execute('''SELECT h.*, (SELECT COUNT(*) FROM Room r WHERE r.hostelId = h.id) as roomCount FROM Hostel h''')
                hostels = rows_to_dict(cur.fetchall())
                for h in hostels:
                    h['_count'] = {'rooms': h.pop('roomCount', 0)}
                self.send_json({'hostels': hostels})
                conn.close(); return

            # ===== FEES =====
            if path == '/api/fees' and method == 'GET':
                cur.execute('''SELECT f.*, u.name as studentName, s.rollNo, s.department,
                    r.number as roomNumber, h.name as hostelName
                    FROM Fee f LEFT JOIN Student s ON f.studentId = s.id
                    LEFT JOIN User u ON s.userId = u.id
                    LEFT JOIN Room r ON s.roomId = r.id LEFT JOIN Hostel h ON r.hostelId = h.id
                    ORDER BY f.createdAt DESC LIMIT 100''')
                fees = rows_to_dict(cur.fetchall())
                for f in fees:
                    f['student'] = {'name': f.pop('studentName',''), 'rollNo': f.pop('rollNo',''), 'department': f.pop('department',''),
                        'room': {'number': f.pop('roomNumber',''), 'hostel': {'name': f.pop('hostelName','')}}}
                self.send_json({'fees': fees})
                conn.close(); return

            if path == '/api/fees' and method == 'POST':
                import uuid
                fid = uuid.uuid4().hex[:25]
                now = datetime.now().isoformat()
                cur.execute('INSERT INTO Fee (id, studentId, amount, month, year, status, feeType, receiptNo, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
                    (fid, body.get('studentId',''), body.get('amount',0), body.get('month',''), body.get('year',2024), body.get('status','Pending'), body.get('feeType','Room Rent'), body.get('receiptNo'), now, now))
                conn.commit()
                self.send_json({'fee': {'id': fid}}, 201)
                conn.close(); return

            if path.startswith('/api/fees/') and method in ('PUT', 'PATCH'):
                fid = path.split('/')[-1]
                fields = []
                values = []
                for k in ['status', 'paidDate', 'feeType', 'receiptNo']:
                    if k in body:
                        fields.append(f'{k} = ?')
                        values.append(body[k])
                if fields:
                    fields.append('updatedAt = ?')
                    values.append(datetime.now().isoformat())
                    values.append(fid)
                    cur.execute(f'UPDATE Fee SET {", ".join(fields)} WHERE id = ?', values)
                    conn.commit()
                self.send_json({'success': True})
                conn.close(); return

            # ===== COMPLAINTS =====
            if path == '/api/complaints' and method == 'GET':
                cur.execute('''SELECT c.*, u.name as studentName, s.rollNo, s.department
                    FROM Complaint c LEFT JOIN Student s ON c.studentId = s.id
                    LEFT JOIN User u ON s.userId = u.id ORDER BY c.createdAt DESC LIMIT 100''')
                complaints = rows_to_dict(cur.fetchall())
                for c in complaints:
                    c['student'] = {'name': c.pop('studentName',''), 'rollNo': c.pop('rollNo',''), 'department': c.pop('department','')}
                self.send_json({'complaints': complaints})
                conn.close(); return

            if path == '/api/complaints' and method == 'POST':
                import uuid
                cid = uuid.uuid4().hex[:25]
                now = datetime.now().isoformat()
                cur.execute('INSERT INTO Complaint (id, studentId, title, description, category, status, priority, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?)',
                    (cid, body.get('studentId',''), body.get('title',''), body.get('description',''), body.get('category',''), body.get('status','Open'), body.get('priority','Medium'), now, now))
                conn.commit()
                self.send_json({'complaint': {'id': cid}}, 201)
                conn.close(); return

            if path.startswith('/api/complaints/') and method in ('PUT', 'PATCH'):
                cid = path.split('/')[-1]
                fields = []
                values = []
                for k in ['status', 'adminReply', 'priority']:
                    if k in body:
                        fields.append(f'{k} = ?')
                        values.append(body[k])
                if fields:
                    fields.append('updatedAt = ?')
                    values.append(datetime.now().isoformat())
                    values.append(cid)
                    cur.execute(f'UPDATE Complaint SET {", ".join(fields)} WHERE id = ?', values)
                    conn.commit()
                self.send_json({'success': True})
                conn.close(); return

            # ===== MAINTENANCE =====
            if path == '/api/maintenance' and method == 'GET':
                cur.execute('''SELECT m.*, r.number as roomNumber, h.name as hostelName,
                    u.name as studentName, s.rollNo
                    FROM MaintenanceRequest m LEFT JOIN Room r ON m.roomId = r.id
                    LEFT JOIN Hostel h ON r.hostelId = h.id
                    LEFT JOIN Student s ON m.studentId = s.id LEFT JOIN User u ON s.userId = u.id
                    ORDER BY m.createdAt DESC LIMIT 100''')
                mrs = rows_to_dict(cur.fetchall())
                for m in mrs:
                    m['room'] = {'number': m.pop('roomNumber',''), 'hostel': {'name': m.pop('hostelName','')}}
                    m['student'] = {'name': m.pop('studentName',''), 'rollNo': m.pop('rollNo','')}
                self.send_json({'maintenanceRequests': mrs})
                conn.close(); return

            if path == '/api/maintenance' and method == 'POST':
                import uuid
                mid = uuid.uuid4().hex[:25]
                now = datetime.now().isoformat()
                cur.execute('INSERT INTO MaintenanceRequest (id, roomId, studentId, title, description, category, status, priority, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
                    (mid, body.get('roomId',''), body.get('studentId',''), body.get('title',''), body.get('description',''), body.get('category',''), body.get('status','Pending'), body.get('priority','Medium'), now, now))
                conn.commit()
                self.send_json({'maintenanceRequest': {'id': mid}}, 201)
                conn.close(); return

            if path.startswith('/api/maintenance/') and method in ('PUT', 'PATCH'):
                mid = path.split('/')[-1]
                fields = []
                values = []
                for k in ['status', 'priority']:
                    if k in body:
                        fields.append(f'{k} = ?')
                        values.append(body[k])
                if fields:
                    fields.append('updatedAt = ?')
                    values.append(datetime.now().isoformat())
                    values.append(mid)
                    cur.execute(f'UPDATE MaintenanceRequest SET {", ".join(fields)} WHERE id = ?', values)
                    conn.commit()
                self.send_json({'success': True})
                conn.close(); return

            # ===== STAFF =====
            if path == '/api/staff' and method == 'GET':
                cur.execute('''SELECT s.*, h.name as hostelName FROM Staff s LEFT JOIN Hostel h ON s.hostelId = h.id LIMIT 100''')
                staff = rows_to_dict(cur.fetchall())
                for s in staff:
                    s['hostel'] = {'name': s.pop('hostelName','')}
                self.send_json({'staff': staff})
                conn.close(); return

            if path == '/api/staff' and method == 'POST':
                import uuid
                sid = uuid.uuid4().hex[:25]
                now = datetime.now().isoformat()
                cur.execute('INSERT INTO Staff (id, name, role, phone, hostelId, salary, joinDate, status, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
                    (sid, body.get('name',''), body.get('role',''), body.get('phone',''), body.get('hostelId',''), body.get('salary'), body.get('joinDate'), body.get('status','Active'), now, now))
                conn.commit()
                self.send_json({'staff': {'id': sid}}, 201)
                conn.close(); return

            if path.startswith('/api/staff/') and method in ('PUT', 'PATCH'):
                sid = path.split('/')[-1]
                fields = []
                values = []
                for k in ['name', 'role', 'phone', 'hostelId', 'salary', 'joinDate', 'status']:
                    if k in body:
                        fields.append(f'{k} = ?')
                        values.append(body[k])
                if fields:
                    fields.append('updatedAt = ?')
                    values.append(datetime.now().isoformat())
                    values.append(sid)
                    cur.execute(f'UPDATE Staff SET {", ".join(fields)} WHERE id = ?', values)
                    conn.commit()
                self.send_json({'success': True})
                conn.close(); return

            if path.startswith('/api/staff/') and method == 'DELETE':
                sid = path.split('/')[-1]
                cur.execute('DELETE FROM Staff WHERE id = ?', (sid,))
                conn.commit()
                self.send_json({'success': True})
                conn.close(); return

            # ===== NOTICES =====
            if path == '/api/notices' and method == 'GET':
                cur.execute('SELECT * FROM Notice ORDER BY createdAt DESC LIMIT 50')
                notices = rows_to_dict(cur.fetchall())
                self.send_json({'notices': notices})
                conn.close(); return

            if path == '/api/notices' and method == 'POST':
                import uuid
                nid = uuid.uuid4().hex[:25]
                now = datetime.now().isoformat()
                cur.execute('INSERT INTO Notice (id, title, content, category, priority, createdBy, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?)',
                    (nid, body.get('title',''), body.get('content',''), body.get('category','General'), body.get('priority','Normal'), body.get('createdBy'), now, now))
                conn.commit()
                self.send_json({'notice': {'id': nid}}, 201)
                conn.close(); return

            if path.startswith('/api/notices/') and method in ('PUT', 'PATCH'):
                nid = path.split('/')[-1]
                fields = []
                values = []
                for k in ['title', 'content', 'category', 'priority', 'createdBy']:
                    if k in body:
                        fields.append(f'{k} = ?')
                        values.append(body[k])
                if fields:
                    fields.append('updatedAt = ?')
                    values.append(datetime.now().isoformat())
                    values.append(nid)
                    cur.execute(f'UPDATE Notice SET {", ".join(fields)} WHERE id = ?', values)
                    conn.commit()
                self.send_json({'success': True})
                conn.close(); return

            if path.startswith('/api/notices/') and method == 'DELETE':
                nid = path.split('/')[-1]
                cur.execute('DELETE FROM Notice WHERE id = ?', (nid,))
                conn.commit()
                self.send_json({'success': True})
                conn.close(); return

            # ===== NOTIFICATIONS =====
            if path == '/api/notifications' and method == 'GET':
                user_id = params.get('userId', [''])[0]
                if user_id:
                    cur.execute('SELECT * FROM Notification WHERE userId = ? ORDER BY createdAt DESC LIMIT 50', (user_id,))
                    notifications = rows_to_dict(cur.fetchall())
                    unread = sum(1 for n in notifications if not n.get('read', False))
                    self.send_json({'notifications': notifications, 'unreadCount': unread})
                else:
                    self.send_json({'notifications': [], 'unreadCount': 0})
                conn.close(); return

            if path == '/api/notifications/mark-all-read' and method == 'POST':
                user_id = params.get('userId', [''])[0]
                if user_id:
                    cur.execute('UPDATE Notification SET "read" = 1, updatedAt = ? WHERE userId = ? AND "read" = 0', (datetime.now().isoformat(), user_id))
                    conn.commit()
                self.send_json({'success': True})
                conn.close(); return

            if path == '/api/notifications/broadcast' and method == 'POST':
                cur.execute('SELECT id FROM User')
                users = rows_to_dict(cur.fetchall())
                import uuid
                now = datetime.now().isoformat()
                count = 0
                for u in users:
                    nid = uuid.uuid4().hex[:25]
                    cur.execute('INSERT INTO Notification (id, userId, title, message, type, priority, category, "read", isBroadcast, senderName, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                        (nid, u['id'], body.get('title',''), body.get('message',''), body.get('type','info'), body.get('priority','Normal'), body.get('category','General'), 0, 1, body.get('senderName'), now, now))
                    count += 1
                conn.commit()
                self.send_json({'count': count})
                conn.close(); return

            if path == '/api/notifications/analytics' and method == 'GET':
                self.send_json({'totalSent': 0, 'totalRead': 0, 'byCategory': {}, 'byPriority': {}, 'recentTrend': []})
                conn.close(); return

            if path.startswith('/api/notifications/') and method in ('PUT', 'PATCH'):
                nid = path.split('/')[-1]
                fields = []
                values = []
                for k in ['read', 'title', 'message']:
                    if k in body:
                        col = '"read"' if k == 'read' else k
                        fields.append(f'{col} = ?')
                        values.append(body[k])
                if fields:
                    fields.append('updatedAt = ?')
                    values.append(datetime.now().isoformat())
                    values.append(nid)
                    cur.execute(f'UPDATE Notification SET {", ".join(fields)} WHERE id = ?', values)
                    conn.commit()
                self.send_json({'success': True})
                conn.close(); return

            # ===== ANNOUNCEMENTS =====
            if path == '/api/announcements' and method == 'GET':
                cur.execute('SELECT * FROM Announcement ORDER BY createdAt DESC LIMIT 20')
                announcements = rows_to_dict(cur.fetchall())
                self.send_json({'announcements': announcements})
                conn.close(); return

            if path == '/api/announcements' and method == 'POST':
                import uuid
                aid = uuid.uuid4().hex[:25]
                now = datetime.now().isoformat()
                cur.execute('INSERT INTO Announcement (id, title, content, category, priority, type, targetRole, isActive, createdBy, createdById, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                    (aid, body.get('title',''), body.get('content',''), body.get('category','General'), body.get('priority','Normal'), body.get('type','Notice'), body.get('targetRole','all'), 1, body.get('createdBy'), body.get('createdById'), now, now))
                conn.commit()
                self.send_json({'announcement': {'id': aid}}, 201)
                conn.close(); return

            # ===== MOVEMENTS =====
            if path == '/api/movements' and method == 'GET':
                student_id = params.get('studentId', [''])[0]
                if student_id:
                    cur.execute('''SELECT sm.*, u.name as studentName, u.email as studentEmail, s.rollNo, s.department, s.semester,
                        r.number as roomNumber, h.name as hostelName
                        FROM StudentMovement sm LEFT JOIN Student s ON sm.studentId = s.id
                        LEFT JOIN User u ON s.userId = u.id LEFT JOIN Room r ON s.roomId = r.id
                        LEFT JOIN Hostel h ON r.hostelId = h.id WHERE sm.studentId = ?
                        ORDER BY sm.createdAt DESC LIMIT 100''', (student_id,))
                else:
                    cur.execute('''SELECT sm.*, u.name as studentName, u.email as studentEmail, s.rollNo, s.department, s.semester,
                        r.number as roomNumber, h.name as hostelName
                        FROM StudentMovement sm LEFT JOIN Student s ON sm.studentId = s.id
                        LEFT JOIN User u ON s.userId = u.id LEFT JOIN Room r ON s.roomId = r.id
                        LEFT JOIN Hostel h ON r.hostelId = h.id
                        ORDER BY sm.createdAt DESC LIMIT 100''')
                movements = rows_to_dict(cur.fetchall())
                stats = {
                    'currentlyOutside': sum(1 for m in movements if m.get('status') == 'Out'),
                    'returnedToday': sum(1 for m in movements if m.get('status') == 'Returned'),
                    'pendingApprovals': sum(1 for m in movements if m.get('status') == 'Pending'),
                    'lateReturns': sum(1 for m in movements if m.get('status') == 'Late Return'),
                    'totalRecords': len(movements)
                }
                for m in movements:
                    m['student'] = {'id': m.get('studentId'), 'name': m.pop('studentName',''), 'email': m.pop('studentEmail',''),
                        'rollNo': m.pop('rollNo',''), 'department': m.pop('department',''), 'semester': m.pop('semester',''),
                        'room': {'number': m.pop('roomNumber',''), 'hostel': m.pop('hostelName','')} if m.get('roomNumber') else None}
                self.send_json({'movements': movements, 'stats': stats})
                conn.close(); return

            if path == '/api/movements' and method == 'POST':
                import uuid
                mid = uuid.uuid4().hex[:25]
                now = datetime.now().isoformat()
                cur.execute('INSERT INTO StudentMovement (id, studentId, reason, departureDate, expectedReturnDate, destination, guardianContact, notes, status, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
                    (mid, body.get('studentId',''), body.get('reason',''), body.get('departureDate',''), body.get('expectedReturnDate',''), body.get('destination'), body.get('guardianContact'), body.get('notes'), body.get('status','Pending'), now, now))
                conn.commit()
                self.send_json({'movement': {'id': mid}}, 201)
                conn.close(); return

            if path.startswith('/api/movements/') and method in ('PUT', 'PATCH'):
                mid = path.split('/')[-1]
                fields = []
                values = []
                for k in ['status', 'approvedBy', 'adminRemark', 'actualReturnDate', 'departureSignature', 'returnSignature']:
                    if k in body:
                        fields.append(f'{k} = ?')
                        values.append(body[k])
                if fields:
                    fields.append('updatedAt = ?')
                    values.append(datetime.now().isoformat())
                    values.append(mid)
                    cur.execute(f'UPDATE StudentMovement SET {", ".join(fields)} WHERE id = ?', values)
                    conn.commit()
                self.send_json({'success': True})
                conn.close(); return

            # ===== APPLICATIONS =====
            if path == '/api/applications' and method == 'GET':
                cur.execute('''SELECT a.*, u.name as studentName, s.rollNo, s.department, h.name as hostelName
                    FROM Application a LEFT JOIN Student s ON a.studentId = s.id
                    LEFT JOIN User u ON s.userId = u.id LEFT JOIN Hostel h ON a.hostelId = h.id
                    ORDER BY a.createdAt DESC LIMIT 100''')
                apps = rows_to_dict(cur.fetchall())
                for a in apps:
                    a['student'] = {'name': a.pop('studentName',''), 'rollNo': a.pop('rollNo',''), 'department': a.pop('department','')}
                    a['hostel'] = {'name': a.pop('hostelName','')}
                self.send_json({'applications': apps})
                conn.close(); return

            if path == '/api/applications' and method == 'POST':
                import uuid
                aid = uuid.uuid4().hex[:25]
                now = datetime.now().isoformat()
                cur.execute('INSERT INTO Application (id, studentId, hostelId, preferredRoom, status, message, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?)',
                    (aid, body.get('studentId',''), body.get('hostelId',''), body.get('preferredRoom'), body.get('status','Pending'), body.get('message'), now, now))
                conn.commit()
                self.send_json({'application': {'id': aid}}, 201)
                conn.close(); return

            if path.startswith('/api/applications/') and method in ('PUT', 'PATCH'):
                aid = path.split('/')[-1]
                fields = []
                values = []
                for k in ['status', 'adminRemark']:
                    if k in body:
                        fields.append(f'{k} = ?')
                        values.append(body[k])
                if fields:
                    fields.append('updatedAt = ?')
                    values.append(datetime.now().isoformat())
                    values.append(aid)
                    cur.execute(f'UPDATE Application SET {", ".join(fields)} WHERE id = ?', values)
                    conn.commit()
                self.send_json({'success': True})
                conn.close(); return

            # ===== SEED =====
            if path == '/api/seed' and method in ('GET', 'POST'):
                self.send_json({'message': 'Database already seeded'})
                conn.close(); return

            # ===== HEALTH =====
            if path == '/api/health':
                self.send_json({'status': 'ok', 'timestamp': datetime.now().isoformat()})
                conn.close(); return

            # ===== CATCH-ALL API =====
            if path.startswith('/api/'):
                self.send_json([])
                conn.close(); return

            conn.close()
            self.send_json({'error': 'Not found'}, 404)

        except Exception as e:
            self.send_json({'error': str(e)}, 500)

if __name__ == '__main__':
    srv = ThreadedHTTPServer(('0.0.0.0', 3000), HostelHandler)
    print(f'River Boy Hostel Server running on port 3000 (Python)')
    srv.serve_forever()
