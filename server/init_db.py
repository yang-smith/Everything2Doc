from app import create_app, db

def init_database():
    try:
        print("Initializing database...")
        app = create_app()
        
        with app.app_context():
            # 创建所有表
            db.create_all()
            print("Database initialized successfully!")
        return True
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return False

if __name__ == "__main__":
    init_database() 