import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для работы с отзывами, пользователями и информацией об игре
    Args: event с httpMethod, body, queryStringParameters
    Returns: HTTP response с данными
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'isBase64Encoded': False,
            'body': ''
        }
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        action = query_params.get('action', '')
        body_data = json.loads(event.get('body', '{}')) if event.get('body') else {}
        review_id = query_params.get('id', '')
        
        if action == 'get_reviews':
            return get_reviews(conn)
        elif action == 'create_review':
            return create_review(conn, body_data)
        elif action == 'update_review':
            return update_review(conn, review_id, body_data)
        elif action == 'delete_review':
            return delete_review(conn, review_id)
        elif action == 'login':
            return login(conn, body_data)
        elif action == 'register':
            return register(conn, body_data)
        elif action == 'get_game_info':
            return get_game_info(conn)
        elif action == 'update_game_info':
            return update_game_info(conn, body_data)
        else:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'message': 'API ready', 'method': method, 'action': action})
            }
    finally:
        conn.close()

def get_reviews(conn) -> Dict[str, Any]:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            SELECT r.id, u.username, r.rating, r.comment, r.is_approved, r.created_at
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        ''')
        reviews = cur.fetchall()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps([dict(r) for r in reviews], default=str)
        }

def create_review(conn, data: Dict[str, Any]) -> Dict[str, Any]:
    user_id = data.get('user_id')
    rating = data.get('rating')
    comment = data.get('comment')
    is_admin = data.get('is_admin', False)
    
    with conn.cursor() as cur:
        cur.execute('''
            INSERT INTO reviews (user_id, rating, comment, is_approved)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        ''', (user_id, rating, comment, is_admin))
        review_id = cur.fetchone()[0]
        conn.commit()
        
    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'id': review_id, 'message': 'Review created'})
    }

def update_review(conn, review_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    is_approved = data.get('is_approved')
    
    with conn.cursor() as cur:
        cur.execute('''
            UPDATE reviews SET is_approved = %s WHERE id = %s
        ''', (is_approved, review_id))
        conn.commit()
        
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'message': 'Review updated'})
    }

def delete_review(conn, review_id: str) -> Dict[str, Any]:
    with conn.cursor() as cur:
        cur.execute('UPDATE reviews SET is_approved = false WHERE id = %s', (review_id,))
        conn.commit()
        
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'message': 'Review deleted'})
    }

def login(conn, data: Dict[str, Any]) -> Dict[str, Any]:
    username = data.get('username')
    password = data.get('password')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            SELECT id, username, is_admin FROM users 
            WHERE username = %s AND password = %s
        ''', (username, password))
        user = cur.fetchone()
        
    if user:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps(dict(user))
        }
    else:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Invalid credentials'})
        }

def register(conn, data: Dict[str, Any]) -> Dict[str, Any]:
    username = data.get('username')
    password = data.get('password')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            INSERT INTO users (username, password, is_admin)
            VALUES (%s, %s, false)
            RETURNING id, username, is_admin
        ''', (username, password))
        user = cur.fetchone()
        conn.commit()
        
    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps(dict(user))
    }

def get_game_info(conn) -> Dict[str, Any]:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('SELECT * FROM game_info ORDER BY id DESC LIMIT 1')
        info = cur.fetchone()
        
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps(dict(info) if info else {}, default=str)
    }

def update_game_info(conn, data: Dict[str, Any]) -> Dict[str, Any]:
    title = data.get('title')
    description = data.get('description')
    cover_url = data.get('cover_url')
    steam_url = data.get('steam_url')
    
    with conn.cursor() as cur:
        cur.execute('''
            UPDATE game_info 
            SET title = %s, description = %s, cover_url = %s, steam_url = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        ''', (title, description, cover_url, steam_url))
        conn.commit()
        
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'message': 'Game info updated'})
    }
