import os
from PIL import Image

def check_images(directory):
    print(f"🔍 Vérification des images dans : {directory}\n")
    invalid_files = []

    for filename in os.listdir(directory):
        path = os.path.join(directory, filename)

        # Fichier vide ?
        if os.path.getsize(path) == 0:
            print(f"❌ {filename} est vide (0 octets)")
            invalid_files.append(filename)
            continue

        # Peut-on l'ouvrir comme image ?
        try:
            with Image.open(path) as img:
                img.verify()  # ne charge pas complètement mais vérifie
        except Exception as e:
            print(f"❌ {filename} est invalide ou corrompu : {e}")
            invalid_files.append(filename)
        else:
            print(f"✅ {filename} est OK")

    print("\n✅ Vérification terminée.")
    if invalid_files:
        print("\n❌ Fichiers invalides ou à supprimer/régénérer :")
        for f in invalid_files:
            print(f" - {f}")
    else:
        print("🎉 Toutes les images sont valides !")

# 🔁 À lancer :
check_images("server/public/images")
