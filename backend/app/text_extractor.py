import io
from abc import ABC, abstractmethod
from typing import BinaryIO
from pathlib import Path
import fitz


class BaseTextExtractor(ABC):
    def __init__(self, file_stream: BinaryIO, filename: str):
        self.file_stream = file_stream
        self.filename = filename
        self._validate_stream()

    def _validate_stream(self):
        if not isinstance(self.file_stream, io.IOBase):
            raise TypeError("Expected a file-like object (e.g. io.BytesIO)")

        self.file_stream.seek(0, io.SEEK_END)
        size = self.file_stream.tell()
        self.file_stream.seek(0)

        if size > 50 * 1024 * 1024:  # Limit to 50 MB
            raise ValueError("The file is too large to process in memory (>50MB)")

    @abstractmethod
    def extract(self) -> str:
        pass


class PdfExtractor(BaseTextExtractor):
    def extract(self) -> str:
        text = []
        with fitz.open(stream=self.file_stream, filetype="pdf") as doc:
            for page in doc:
                text.append(page.get_text())
        return "\n".join(text)


class TxtExtractor(BaseTextExtractor):
    def extract(self) -> str:
        self.file_stream.seek(0)
        return self.file_stream.read().decode("utf-8")


def get_stream_extractor(file_stream: BinaryIO, filename: str) -> BaseTextExtractor:
    ext = Path(filename).suffix.lower()

    extractors_map = {
        ".txt": TxtExtractor,
        ".pdf": PdfExtractor,
    }

    extractor_class = extractors_map.get(ext)
    if not extractor_class:
        raise ValueError(f"Unsupported format: {ext}")

    return extractor_class(file_stream, filename)
