import requests
import os
from PIL import Image
from io import BytesIO

# Dossier pour les images côté serveur
IMAGE_DIR = "server/public/images"

def get_cover_and_metadata(artist, album):
    search_url = f"https://musicbrainz.org/ws/2/release/?query=album:{album}%20AND%20artist:{artist}&fmt=json&inc=release-groups"
    headers = {
        "User-Agent": "GuessTheCoverApp/1.0 ( contact@example.com )"
    }

    res = requests.get(search_url, headers=headers).json()
    if 'releases' not in res or not res['releases']:
        print(f"❌ Aucun résultat pour : {artist} - {album}")
        return None

    try:
        release = res['releases'][0]
        release_id = release['id']
        cover_url = f"https://coverartarchive.org/release/{release_id}/front"
        img_response = requests.get(cover_url)

        # Vérifie si on a bien une image
        if img_response.status_code != 200 or "image" not in img_response.headers.get("Content-Type", ""):
            print(f"❌ Pas d'image trouvée pour {artist} - {album}")
            return None

        # Test de validité avec Pillow
        try:
            img_check = Image.open(BytesIO(img_response.content))
            img_check.verify()
        except Exception as e:
            print(f"❌ Image corrompue : {artist} - {album} ({e})")
            return None

        # Sauvegarde
        filename = f"{artist} - {album}.jpg".replace("/", "_").replace(":", "-").replace('"', "").replace("'", "").replace("?", "")
        filepath = os.path.join(IMAGE_DIR, filename)
        os.makedirs(IMAGE_DIR, exist_ok=True)

        with open(filepath, 'wb') as f:
            f.write(img_response.content)

        # Métadonnées
        language = release.get("text-representation", {}).get("language", "")
        date = release.get("date", "")
        group_id = release.get("release-group", {}).get("id", "")

        genre = ""
        if group_id:
            group_url = f"https://musicbrainz.org/ws/2/release-group/{group_id}?fmt=json&inc=genres"
            group_data = requests.get(group_url, headers=headers).json()
            if "genres" in group_data and group_data["genres"]:
                genre = group_data["genres"][0]["name"]

        print(f"✅ {filename} enregistrée avec genre: {genre}, langue: {language}, date: {date}")
        return {
            "artist": artist,
            "album": album,
            "filename": filename,
            "answer_artist": artist.lower(),
            "answer_album": album.lower(),
            "genre": genre,
            "language": language,
            "date": date
        }

    except Exception as e:
        print(f"❌ Erreur pour {artist} - {album} :", e)
        return None

def generate_sql(filepath_input, sql_output_path):
    with open(filepath_input, "r", encoding="utf-8") as file, \
         open(sql_output_path, "w", encoding="utf-8") as sql_output:

        sql_output.write("-- Insertion dans la table `covers`\n")
        sql_output.write("INSERT INTO covers (artist, album, filename, answer_artist, answer_album, genre, langue, date_publication) VALUES\n")

        lines = []
        for line in file:
            line = line.strip()
            if " - " in line:
                artist, album = line.split(" - ", 1)
                data = get_cover_and_metadata(artist.strip(), album.strip())
                if data:
                    artist_sql = data["artist"].replace("'", "''")
                    album_sql = data["album"].replace("'", "''")
                    answer_artist_sql = data["answer_artist"].replace("'", "''")
                    answer_album_sql = data["answer_album"].replace("'", "''")
                    filename = data["filename"]
                    genre = data["genre"].replace("'", "''")
                    lang = data["language"]
                    date = data["date"] or "NULL"
                    date_sql = f"'{date}'" if date != "NULL" else "NULL"

                    lines.append(
                        f"('{artist_sql}', '{album_sql}', '{filename}', '{answer_artist_sql}', '{answer_album_sql}', '{genre}', '{lang}', {date_sql})"
                    )
            else:
                print(f"⚠️ Ligne ignorée : {line}")

        if lines:
            sql_output.write(",\n".join(lines) + ";\n")
        else:
            sql_output.write("-- Aucune donnée à insérer\n")

# Lancement :
generate_sql("albums.txt", "insert_covers.sql")
