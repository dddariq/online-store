from setuptools import setup, find_packages

setup(
    name="online-store-backend",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "fastapi==0.115.0",
        "uvicorn==0.23.2",
        "sqlalchemy==2.0.23",
        "python-jose[cryptography]==3.3.0",
        "passlib==1.7.4",
        "python-multipart==0.0.6",
        "pydantic==2.5.3",
        "python-dotenv==1.0.0",
        "websockets==11.0.3",
        "greenlet==3.0.1"
    ],
    python_requires=">=3.8",
    package_dir={"": "backend"},
    include_package_data=True,
    author="Your Name",
    author_email="your.email@example.com",
    description="Backend for online store with FastAPI",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)