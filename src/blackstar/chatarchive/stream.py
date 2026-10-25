from __future__ import annotations

import codecs
import json
from typing import BinaryIO, Iterator

from .schema import REFERENCE_KEYS


def iter_json_values(binary: BinaryIO) -> Iterator[tuple[int, object, str]]:
    """Stream top-level array items (or one value) without loading the whole file."""
    reader = codecs.getreader("utf-8-sig")(binary, errors="strict")
    decoder = json.JSONDecoder()
    buffer, pos, eof, index = "", 0, False, 0

    def fill() -> None:
        nonlocal buffer, eof
        chunk = reader.read(1024 * 1024)
        if chunk == "":
            eof = True
        else:
            buffer += chunk

    def skip_space() -> None:
        nonlocal pos
        while True:
            while pos < len(buffer) and buffer[pos].isspace():
                pos += 1
            if pos < len(buffer) or eof:
                return
            fill()

    fill()
    skip_space()
    if pos >= len(buffer):
        return
    is_array = buffer[pos] == "["
    if is_array:
        pos += 1
    while True:
        skip_space()
        if is_array:
            while True:
                skip_space()
                if pos >= len(buffer):
                    if eof:
                        raise ValueError("unterminated top-level JSON array")
                    fill()
                    continue
                if buffer[pos] == "]":
                    return
                if buffer[pos] == ",":
                    pos += 1
                    continue
                break
        elif index:
            return
        while True:
            try:
                value, end = decoder.raw_decode(buffer, pos)
                token = buffer[pos:end]
                break
            except json.JSONDecodeError:
                if eof:
                    raise
                fill()
        yield index, value, token
        index += 1
        pos = end
        if pos > 2 * 1024 * 1024:
            buffer, pos = buffer[pos:], 0
        if not is_array:
            return


def extract_text(content: object) -> str:
    if not isinstance(content, dict):
        return ""
    pieces: list[str] = []
    for key in ("text", "result", "code"):
        value = content.get(key)
        if isinstance(value, str) and value:
            pieces.append(value)
    parts = content.get("parts")
    if isinstance(parts, list):
        for part in parts:
            if isinstance(part, str):
                pieces.append(part)
            elif isinstance(part, dict):
                if part.get("content_type") in {"image_asset_pointer", "image_url", "audio_asset_pointer"}:
                    continue
                for key in ("text", "content", "code"):
                    value = part.get(key)
                    if isinstance(value, str) and value:
                        pieces.append(value)
    out, seen = [], set()
    for piece in pieces:
        if piece not in seen:
            out.append(piece)
            seen.add(piece)
    return "\n".join(out)


def walk_references(value: object, prefix: str = "") -> Iterator[tuple[str, str, str]]:
    if isinstance(value, dict):
        for key, item in value.items():
            path = f"{prefix}.{key}" if prefix else key
            if key in REFERENCE_KEYS and isinstance(item, (str, int, float)):
                text = str(item)
                if key != "name" or any(mark in text.lower() for mark in ("file", ".png", ".jpg", ".pdf", ".txt", ".json", ".zip")):
                    yield "structured-reference", path, text
            yield from walk_references(item, path)
    elif isinstance(value, list):
        for index, item in enumerate(value):
            yield from walk_references(item, f"{prefix}[{index}]")
