import os
import django
import asyncio
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from channels.testing import WebsocketCommunicator
from backend.asgi import application

async def test_ws():
    print("Testing connection to ws/quiz-proctor/1/ ...")
    comm = WebsocketCommunicator(application, "/ws/quiz-proctor/1/")
    connected, subprotocol = await comm.connect()
    print("Connected:", connected, "Subprotocol:", subprotocol)
    if not connected:
        return

    # Listen for a second to see if it immediately closes or errors
    try:
        # Send a tab switch message
        await comm.send_json_to({
            "action": "STUDENT_JOINED",
            "attempt_id": "test"
        })
        print("Sent STUDENT_JOINED")
        response = await comm.receive_nothing()
        print("Receive nothing check:", response)
    except Exception as e:
        print("Exception during test:", type(e), e)
    finally:
        await comm.disconnect()
        print("Disconnected cleanly.")

if __name__ == "__main__":
    asyncio.run(test_ws())
