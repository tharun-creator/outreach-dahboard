import requests
import json
import os

api_key = os.environ.get("OPENROUTER_API_KEY")
if not api_key:
    print("Please set OPENROUTER_API_KEY environment variable")
    exit(1)

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
}

# First API call with reasoning
response = requests.post(
    url="https://openrouter.ai/api/v1/chat/completions",
    headers=headers,
    data=json.dumps({
        "model": "moonshotai/kimi-k3",
        "messages": [
            {
                "role": "user",
                "content": "How many r's are in the word 'strawberry'?"
            }
        ],
        "reasoning": {"enabled": True},
        "max_tokens": 500
    })
)

response_json = response.json()
print("First response:")
print(json.dumps(response_json, indent=2))

# Extract the assistant message with reasoning_details
assistant_msg = response_json['choices'][0]['message']

# Preserve the assistant message with reasoning_details
messages = [
    {"role": "user", "content": "How many r's are in the word 'strawberry'?"},
    {
        "role": "assistant",
        "content": assistant_msg.get('content'),
        "reasoning_details": assistant_msg.get('reasoning_details')
    },
    {"role": "user", "content": "Are you sure? Think carefully."}
]

# Second API call - model continues reasoning from where it left off
response2 = requests.post(
    url="https://openrouter.ai/api/v1/chat/completions",
    headers=headers,
    data=json.dumps({
        "model": "moonshotai/kimi-k3",
        "messages": messages,
        "reasoning": {"enabled": True},
        "max_tokens": 500
    })
)

response2_json = response2.json()
print("\nSecond response:")
print(json.dumps(response2_json, indent=2))