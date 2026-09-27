import argparse
import os
import sys

# Ensure project root is on sys.path when run directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User
from app.repositories.user_repository import UserRepository


def bootstrap_admin(email: str, password: str | None = None, username: str | None = None):
    db = SessionLocal()
    try:
        repo = UserRepository(db)
        user = repo.get_by_email(email)

        if user:
            if user.role == "admin":
                print(f"User '{user.username}' ({email}) is already an admin.")
                return
            print(f"Promoting existing user '{user.username}' ({email}) to admin...")
            repo.update_role(user.id, "admin")
            db.commit()
            print("Successfully promoted to admin!")
            return

        # User does not exist - create if password provided
        if password:
            user_name = username or email.split("@")[0]
            # Check if username is already taken
            existing_user_by_name = repo.get_by_username(user_name)
            if existing_user_by_name:
                print(f"Error: Username '{user_name}' is already taken by another email. Specify a different --username.")
                sys.exit(1)

            print(f"Creating new admin user '{user_name}' ({email})...")
            new_user = User(
                username=user_name,
                email=email,
                hashed_password=hash_password(password),
                role="admin",
            )
            repo.create(new_user)
            db.commit()
            print("Successfully created admin user!")
        else:
            print(f"Error: User with email '{email}' not found.")
            print("To create this user as admin, provide a password:")
            print(f"  python scripts/bootstrap_admin.py {email} --password <your-password>")
            existing_users = repo.list_users(offset=0, limit=10)
            if existing_users:
                print("\nExisting registered user emails:")
                for u in existing_users:
                    print(f"  - {u.email} (username: {u.username}, role: {u.role})")
            sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bootstrap an admin user in the database.")
    parser.add_argument("email", help="Email address of the admin user")
    parser.add_argument("--password", "-p", default=os.getenv("ADMIN_PASSWORD"), help="Password if creating a new user (or set ADMIN_PASSWORD env var)")
    parser.add_argument("--username", "-u", default=os.getenv("ADMIN_USERNAME"), help="Username if creating a new user (defaults to email prefix)")

    args = parser.parse_args()
    bootstrap_admin(email=args.email, password=args.password, username=args.username)
