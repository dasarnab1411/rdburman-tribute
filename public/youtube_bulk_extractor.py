import re
import pandas as pd
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# --- Configuration ---
# 1. REPLACE THIS WITH YOUR YOUTUBE DATA API KEY
API_KEY = "AIzaSyCl1TQl5Uy0ZlLt8IITQQmfo-9YuUMLAsU" 

# 2. Add your 47 YouTube URLs to this list
#    (Example URLs are provided below)
YOUTUBE_URLS = [
    "https://youtube.com/playlist?list=PLt1_3oWrtFTOFpilXV5DEwZoxKjdXR6Ra&si=bFkh3u6LiG3dssjF",
    "https://youtu.be/honflNZTKHk?si=hv9Hx8Mp2K5HNxDy"
	"https://youtu.be/sxvB0cCQBSg?si=nKHilaVWLS7HPpxw",
	"https://youtu.be/uQvOHHGrMjg?si=tdRtS57yk-lMb4SH",
	"https://youtu.be/pHJiYu69C4c?si=xskoVED0slaCnzR5",
	"https://youtu.be/PBLmRYnFs7E?si=vSkvSgeTqBKEt3sO",
    "https://youtu.be/CpYuH4Cc8Mk?si=qK5iGgqa3qsPRKH0",
    "https://youtu.be/C1w6p3TEVxI?si=CkHwXCKJOBhZwWkK",
    "https://youtu.be/WaCRlPUPLhk?si=Nq_DXLhf7aS2DjGu",
    "https://youtu.be/PleWU2pdK-I?si=PK_rAjjC72uEVZrZ",
    "https://youtu.be/xkQpfIMj1UE?si=RerH28vnO62xX_s6",
    "https://youtu.be/flFE-ps5yYo?si=C90tKlW2S2fhkswP",
    "https://youtu.be/tC11eSDHobE?si=LpParr0eIVJHpLeT",
    "https://youtu.be/2fUVcrMA8Dg?si=bXt_fKwl3TEJiqiY",
    "https://youtu.be/0VbyQ5tdavI?si=IP277RozQo8C-FBe",
    "https://youtu.be/iaLmf7L-B24?si=YV8cIZJ5yHJUapXE",
    "https://youtu.be/RscsV4uuetw?si=HUEUjhme8qBCWgTd",
    "https://youtu.be/ADYDEx1pvEg?si=WKjpAxfpZMgEWOOy",
    "https://youtu.be/PZzK3CVzLKo?si=y9ntwMjpZFCPp6dU",
    "https://youtu.be/wVlsl3QXwKU?si=u-ReqZGUQX_0Gi36",
    "https://youtu.be/M_mA1M44Bwc?si=wwIEDgVbo6a2_DoT",
    "https://youtu.be/t6iLjbkxBZo?si=IZYjFNUaK22H1qlN",
    "https://youtu.be/8t5Rt_LWmpE?si=cVRNkFxngFAPwxtq",
    "https://youtu.be/h34dmUw_yCQ?si=kBKlVoNxUkzEiJy3",
    "https://youtu.be/kkTv_aUjd5Y?si=TCkKvKpl_76ovFE8",
    "https://youtu.be/wKnWL8-6qWA?si=SqpxOfrM2GfL3Zbr",
    "https://youtu.be/lu5MjHcy6Lg?si=U_kUjhTdIKlHEPoE",
    "https://youtu.be/XI2P7HgHK9M?si=dSGqPnPDrSF8l4r7",
    "https://youtu.be/aWJc-cT12Mc?si=A7qUwE_j4Nn_6PNN",
    "https://youtu.be/UUHuIsaNTpM?si=c6vz-9Yk28HIyiL_",
    "https://youtu.be/uj5OLjty0l4?si=CBcss2RilACiME4U",
    "https://youtu.be/30rLo4X4aI0?si=5z-mBemInLHG5BSY",
    "https://youtu.be/kT3rzroZSlw?si=oLL7SB-Ta9bbokKH",
    "https://youtu.be/6GSUGstpEwY?si=fv2IS9y7Ik5mZIUG",
    "https://youtu.be/W29sLG5YEEU?si=jeD1MNKqRDtYo9AB",
    "https://youtu.be/CuX6iBnHCog?si=EiQBJU1f7jSJnO5V",
    "https://youtu.be/4yUauK-So28?si=SWzVaVGZ8Zv5mH_O",
    "https://youtu.be/YQNb89xnKvQ?si=pyGPH6aMgEP0P8Kk",
    "https://youtu.be/LblLAQQV6ko?si=-u1Xhzl87LyAqL1j",
    "https://youtu.be/STOM6NZfcrs?si=gXLx-s67rWOO7HYm",
    "https://youtu.be/XxbBN4AtFio?si=fc8UNPVlvOFWQnl7",
    "https://youtu.be/WJyM13QI64E?si=0s3hgT9czCLz6uNY",
    "https://youtu.be/lplaAZBWiqY?si=ZiIrD2b5F5RkKUMF",
    "https://youtu.be/g7QUMWO4fNA?si=ICdygdScrCB_E7ji",
    "https://youtu.be/SNKJ1kWP7nU?si=25sXKWWQSOD_NWvN",
    "https://youtu.be/5XjqrXpmLOI?si=SqgTK_bD6ZbFCQYk",
    "https://youtu.be/nhQuJuAyVlo?si=T0yl_Kydq9FeZR3X",
    "https://youtu.be/qU3fSobl6Tg?si=-qD4ayWPRQ66kyvX",
    "https://youtu.be/850bZDi_MD0?si=sQiLbdaGzzX1GcXh",
    "https://youtu.be/T1NtFQHEZhQ?si=nYibiAj47Tvf7N07 ",
    "https://youtu.be/wJ1mqmbngO0?si=Da6UhpFc_5WlyXh-",
    "https://youtu.be/K-GPX2PzDKM?si=CujGtpU8GCbhp6KW"

    # ADD ALL 47 OF YOUR LINKS HERE
]

# --- Helper Function: Extract Video ID ---
def extract_video_id(url):
    """
    Extracts the unique 11-character video ID from various YouTube URL formats.
    """
    # Regex to capture the ID from different common formats
    video_id_match = re.search(
        r"(?:v=|youtu\.be\/|embed\/|v\/)([a-zA-Z0-9_-]{11})", url
    )
    if video_id_match:
        return video_id_match.group(1)
    return None

# --- Main Extraction Function ---
def get_youtube_details(api_key, urls):
    """
    Retrieves video details (title and description) for a list of URLs.
    """
    video_ids = []
    
    # --- STEP 1: Extract all Video IDs ---
    print("--- 1. Extracting Video IDs ---")
    for url in urls:
        video_id = extract_video_id(url)
        if video_id:
            video_ids.append(video_id)
        else:
            print(f"Skipped invalid/unsupported URL: {url}")

    if not video_ids:
        print("No valid video IDs found to process.")
        return []

    # The API allows up to 50 IDs per request, which is perfect for your 47 links.
    id_string = ",".join(video_ids)
    
    # --- STEP 2: Call the YouTube Data API ---
    print(f"--- 2. Calling API for {len(video_ids)} Videos ---")
    try:
        youtube = build('youtube', 'v3', developerKey=api_key)
        
        # 'part=snippet' contains the title and description
        request = youtube.videos().list(
            part="snippet",
            id=id_string 
        )
        response = request.execute()

    except HttpError as e:
        print(f"An HTTP error occurred: {e}")
        # This often happens if the API key is invalid or the quota is exceeded.
        return []
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return []

    # --- STEP 3: Parse the Results ---
    results_data = []
    
    for item in response.get("items", []):
        snippet = item["snippet"]
        results_data.append({
            "Video ID": item["id"],
            "Title": snippet["title"],
            "Description": snippet["description"],
            "Channel Title": snippet["channelTitle"],
            "Publish Date": snippet["publishedAt"]
        })
        
    print(f"--- 3. Successfully retrieved details for {len(results_data)} videos ---")
    return results_data

# --- Execution ---
if __name__ == "__main__":
    if API_KEY == "YOUR_API_KEY_HERE":
        print("ERROR: Please replace 'YOUR_API_KEY_HERE' with your actual YouTube Data API Key.")
    else:
        video_details = get_youtube_details(API_KEY, YOUTUBE_URLS)

        if video_details:
            # Create a Pandas DataFrame
            df = pd.DataFrame(video_details)
            
            # Save the results to a CSV file
            output_filename = "youtube_video_data.csv"
            df.to_csv(output_filename, index=False, encoding='utf-8')
            print(f"\n✅ Success! Data saved to **{output_filename}**")
        else:
            print("\n❌ Failed to retrieve video data.")