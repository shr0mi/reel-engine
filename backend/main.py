from fastapi import FastAPI

# Initialize the FastAPI app
app = FastAPI()

# A simple GET endpoint for testing
@app.get("/")
def read_root():
    return {
        "message": "Hello World!",
        "status": "FastAPI is running perfectly!"
    }