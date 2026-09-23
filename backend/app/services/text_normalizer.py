import re

def normalize_text(text: str) -> str:
    text = text.replace("\x00", "")
    # Normalize excessive whitespace.
    text = re.sub(
        r"[ \t]+", " ", text,
    )
    # Normalize excessive blank lines.
    text = re.sub(
        r"\n{3,}", "\n\n", text,
    )

    return text.strip()