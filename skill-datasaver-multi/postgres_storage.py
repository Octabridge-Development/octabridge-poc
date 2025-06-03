"""
Storage driver para PostgreSQL compatible con la interfaz de IBM COS.
Optimizado para manejo seguro de conexiones y claves únicas.
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import os

class PostgresStorageDriver:
    def __init__(self):
        self.conn = psycopg2.connect(
            dbname=os.getenv('PGDATABASE', 'octabridge'),
            user=os.getenv('PGUSER', 'postgres'),
            password=os.getenv('PGPASSWORD', ''),
            host=os.getenv('PGHOST', 'localhost'),
            port=int(os.getenv('PGPORT', 5432))
        )
        self._ensure_table()

    def _ensure_table(self):
        with self.conn.cursor() as cur:
            cur.execute('''
                CREATE TABLE IF NOT EXISTS storage (
                    id SERIAL PRIMARY KEY,
                    bucket VARCHAR(255) NOT NULL,
                    key VARCHAR(255) NOT NULL,
                    data BYTEA,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(bucket, key)
                )
            ''')
            self.conn.commit()

    def put_object(self, Bucket, Key, Body):
        with self.conn.cursor() as cur:
            cur.execute('''
                INSERT INTO storage (bucket, key, data) VALUES (%s, %s, %s)
                ON CONFLICT (bucket, key) DO UPDATE SET data = EXCLUDED.data, created_at = CURRENT_TIMESTAMP
            ''', (Bucket, Key, psycopg2.Binary(Body)))
            self.conn.commit()

    def get_object(self, Bucket, Key):
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('SELECT data FROM storage WHERE bucket=%s AND key=%s', (Bucket, Key))
            row = cur.fetchone()
            if not row:
                raise FileNotFoundError(f'No object found for bucket={Bucket}, key={Key}')
            return row['data']

    def delete_object(self, Bucket, Key):
        with self.conn.cursor() as cur:
            cur.execute('DELETE FROM storage WHERE bucket=%s AND key=%s', (Bucket, Key))
            self.conn.commit()

    def list_objects(self, Bucket):
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('SELECT key FROM storage WHERE bucket=%s', (Bucket,))
            return [row['key'] for row in cur.fetchall()]

    def close(self):
        if self.conn:
            self.conn.close()
