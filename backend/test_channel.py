import os
import django
import asyncio

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from channels.layers import get_channel_layer

async def test():
    layer = get_channel_layer()
    print("Channel layer instance:", type(layer), layer)
    try:
        await layer.group_add("test_room", "test_channel_1")
        print("Group add succeeded!")
        await layer.group_send("test_room", {"type": "test_msg", "data": "hello"})
        print("Group send succeeded!")
    except Exception as e:
        print("Channel layer exception:", type(e), e)

if __name__ == "__main__":
    asyncio.run(test())
