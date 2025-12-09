import os
import csv
import sys
import time
from urllib.parse import urlparse, parse_qs
import requests

API_KEY = "AIzaSyDw_NXGfrrekrhIfT0b9l85tF9jnfadtwA"

if not API_KEY:
    print("ERROR: Please set the YT_API_KEY environment variable with your YouTube Data API key.")
    sys.exit(1)

YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/videos"
MAX_IDS_PER_REQUEST = 50  # YouTube API limit


def extract_video_id(url: str) -> str | None:
    """
    Extracts a YouTube video ID from various YouTube URL formats.
    Supports:
      - https://www.youtube.com/watch?v=VIDEO_ID
      - https://youtu.be/VIDEO_ID
      - https://www.youtube.com/shorts/VIDEO_ID
      - https://www.youtube.com/embed/VIDEO_ID
    Returns None if it can't extract.
    """
    try:
        parsed = urlparse(url.strip())
        if not parsed.netloc:
            return None

        # Normalize hostname
        host = parsed.netloc.lower()

        # 1) Standard watch URL
        if "youtube.com" in host and parsed.path == "/watch":
            qs = parse_qs(parsed.query)
            vid = qs.get("v", [None])[0]
            return vid

        # 2) Short youtu.be URL
        if "youtu.be" in host:
            # path like "/VIDEO_ID"
            return parsed.path.lstrip("/") or None

        # 3) Shorts URL: /shorts/VIDEO_ID
        if "youtube.com" in host and parsed.path.startswith("/shorts/"):
            return parsed.path.split("/")[2] if len(parsed.path.split("/")) > 2 else None

        # 4) Embed URL: /embed/VIDEO_ID
        if "youtube.com" in host and parsed.path.startswith("/embed/"):
            return parsed.path.split("/")[2] if len(parsed.path.split("/")) > 2 else None

        # 5) Fallback: try query param "v" if present
        qs = parse_qs(parsed.query)
        vid = qs.get("v", [None])[0]
        return vid
    except Exception:
        return None


def chunked(iterable, size):
    """Yield successive chunks of given size."""
    for i in range(0, len(iterable), size):
        yield iterable[i:i + size]


def fetch_video_statuses(video_ids):
    """
    Calls YouTube Data API for a list of video IDs (<= 50)
    and returns a dict: {video_id: status_dict}
    """
    params = {
        "part": "status",
        "id": ",".join(video_ids),
        "key": API_KEY,
    }

    resp = requests.get(YOUTUBE_API_URL, params=params, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    result = {}

    # Map API response items by ID
    for item in data.get("items", []):
        vid = item.get("id")
        status = item.get("status", {})
        result[vid] = {
            "embeddable": status.get("embeddable"),
            "privacyStatus": status.get("privacyStatus"),
            "uploadStatus": status.get("uploadStatus"),
            "license": status.get("license"),
            "madeForKids": status.get("madeForKids"),
        }

    return result


def main(input_file: str, output_file: str):
    # 1) Read input URLs
    with open(input_file, "r", encoding="utf-8") as f:
        raw_urls = [line.strip() for line in f if line.strip()]

    if not raw_urls:
        print("No URLs found in input file.")
        return

    # 2) Extract video IDs
    entries = []
    for url in raw_urls:
        vid = extract_video_id(url)
        entries.append({"original_url": url, "video_id": vid})

    # Separate valid / invalid IDs
    valid_entries = [e for e in entries if e["video_id"]]
    invalid_entries = [e for e in entries if not e["video_id"]]

    print(f"Total URLs: {len(entries)}")
    print(f"Valid video IDs: {len(valid_entries)}")
    print(f"Invalid / unrecognized URLs: {len(invalid_entries)}")

    # 3) Query API in chunks
    status_by_id = {}

    for chunk in chunked([e["video_id"] for e in valid_entries], MAX_IDS_PER_REQUEST):
        try:
            data = fetch_video_statuses(chunk)
            status_by_id.update(data)
            # Gentle delay to be nice to the API
            time.sleep(0.1)
        except requests.HTTPError as e:
            print(f"HTTP error while fetching IDs {chunk}: {e}")
        except Exception as e:
            print(f"Unknown error while fetching IDs {chunk}: {e}")

    # 4) Write output CSV
    fieldnames = [
        "original_url",
        "video_id",
        "embeddable",
        "privacyStatus",
        "uploadStatus",
        "license",
        "madeForKids",
        "note",
    ]

    with open(output_file, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        # Valid entries
        for e in valid_entries:
            vid = e["video_id"]
            status = status_by_id.get(vid)
            if status:
                writer.writerow({
                    "original_url": e["original_url"],
                    "video_id": vid,
                    "embeddable": status.get("embeddable"),
                    "privacyStatus": status.get("privacyStatus"),
                    "uploadStatus": status.get("uploadStatus"),
                    "license": status.get("license"),
                    "madeForKids": status.get("madeForKids"),
                    "note": "",
                })
            else:
                # Video not returned → could be deleted, private, or invalid
                writer.writerow({
                    "original_url": e["original_url"],
                    "video_id": vid,
                    "embeddable": None,
                    "privacyStatus": None,
                    "uploadStatus": None,
                    "license": None,
                    "madeForKids": None,
                    "note": "Not found in API response (private/deleted/invalid ID?)",
                })

        # Invalid URLs
        for e in invalid_entries:
            writer.writerow({
                "original_url": e["original_url"],
                "video_id": None,
                "embeddable": None,
                "privacyStatus": None,
                "uploadStatus": None,
                "license": None,
                "madeForKids": None,
                "note": "Could not extract video ID from URL",
            })

    print(f"Done. Report written to: {output_file}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python check_youtube_embeds.py input_urls.txt output_report.csv")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    main(input_path, output_path)
