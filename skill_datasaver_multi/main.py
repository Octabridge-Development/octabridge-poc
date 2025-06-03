"""
Skill para persistencia dual: PostgreSQL y (futuro) IBM COS.
Optimizado para manejo seguro de recursos y extensibilidad.
"""
from .postgres_storage import PostgresStorageDriver

# Placeholder para IBM COS driver (cuando esté disponible)
# from ibm_cos_storage import IbmCosStorageDriver

class DataSaverMulti:
    def __init__(self, use_ibm=False):
        self.pg_driver = PostgresStorageDriver()
        # self.ibm_driver = IbmCosStorageDriver()  # Descomentar cuando IBM COS esté disponible
        self.use_ibm = use_ibm

    def put_object(self, bucket, key, data):
        # Persistencia en PostgreSQL
        self.pg_driver.put_object(Bucket=bucket, Key=key, Body=data)
        # Persistencia en IBM COS si está habilitado
        if self.use_ibm:
            pass  # self.ibm_driver.put_object(Bucket=bucket, Key=key, Body=data)

    def get_object(self, bucket, key):
        # Intenta obtener de PostgreSQL, si falla y hay fallback, intenta IBM COS
        try:
            return self.pg_driver.get_object(Bucket=bucket, Key=key)
        except Exception as e:
            if self.use_ibm:
                pass  # return self.ibm_driver.get_object(Bucket=bucket, Key=key)
            raise e

    def delete_object(self, bucket, key):
        self.pg_driver.delete_object(Bucket=bucket, Key=key)
        if self.use_ibm:
            pass  # self.ibm_driver.delete_object(Bucket=bucket, Key=key)

    def list_objects(self, bucket):
        return self.pg_driver.list_objects(Bucket=bucket)

    def close(self):
        self.pg_driver.close()
        # if self.use_ibm:
        #     self.ibm_driver.close()

# Ejemplo de uso
if __name__ == "__main__":
    ds = DataSaverMulti()
    try:
        ds.put_object('testbucket', 'testkey', b'hello world')
        print(ds.get_object('testbucket', 'testkey'))
        print(ds.list_objects('testbucket'))
        ds.delete_object('testbucket', 'testkey')
    finally:
        ds.close()
