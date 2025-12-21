AVAILABLE_MODELS = [
    "anthropic:claude-haiku-4-5-20251001",
    "anthropic:claude-sonnet-4-5-20250929",
    "openai:gpt-5.2-2025-12-11",
]


def list_models_main() -> None:
    print("Available models:")
    for model in AVAILABLE_MODELS:
        print(f"  - {model}")
