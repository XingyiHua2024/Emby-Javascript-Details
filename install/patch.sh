#!/bin/bash

# === DEFAULT VALUES (can be overridden) ===
CONTAINER_NAME="${CONTAINER_NAME:-linuxserver_emby}"
CONTAINER_WEB_FOLDER="${CONTAINER_WEB_FOLDER:-/app/emby/system/dashboard-ui}"
JS_FILES_LIST="${JS_FILES:-emby_detail_page.js list_page_trailer.js actor_page.js trailer_more_button.js}"
CONFIG_FILE="${CONFIG_FILE:-}"

# Convert space-separated JS_FILES string to array
read -ra JS_FILES_ARRAY <<< "$JS_FILES_LIST"

GITHUB_JS_BASE_URL="https://raw.githubusercontent.com/XingyiHua2024/Emby-Javascript-Details/main"
LOCAL_TEMP_DIR="./web_patch"

echo "📦 Preparing temp directory: $LOCAL_TEMP_DIR"
rm -rf "$LOCAL_TEMP_DIR"
mkdir -p "$LOCAL_TEMP_DIR"

echo "📥 Copying index.html from Docker container: $CONTAINER_NAME"
docker cp "$CONTAINER_NAME:$CONTAINER_WEB_FOLDER/index.html" "$LOCAL_TEMP_DIR/index.html"

echo "🌐 Downloading JS files from GitHub..."
cd "$LOCAL_TEMP_DIR"
for jsfile in "${JS_FILES_ARRAY[@]}"; do
    echo "  - Downloading $jsfile"
    curl -s -O "$GITHUB_JS_BASE_URL/$jsfile"
done
cd -

# ✅ Handle config file (local or default from GitHub)
CONFIG_FILENAME="config.json"

if [[ -n "$CONFIG_FILE" && -f "$CONFIG_FILE" ]]; then
    echo "📝 Using provided config file: $CONFIG_FILE (renamed to $CONFIG_FILENAME)"
    cp "$CONFIG_FILE" "$LOCAL_TEMP_DIR/$CONFIG_FILENAME"
else
    echo "🌐 No config file provided. Downloading default: $CONFIG_FILENAME"
    curl -s -o "$LOCAL_TEMP_DIR/$CONFIG_FILENAME" "https://raw.githubusercontent.com/XingyiHua2024/Emby-Javascript-Details/main/$CONFIG_FILENAME"
fi

echo "🛠️ Checking and patching index.html..."
for jsfile in "${JS_FILES_ARRAY[@]}"; do
    if grep -q "$jsfile" "$LOCAL_TEMP_DIR/index.html"; then
        echo "  - Skipping $jsfile (already included)"
    else
        echo "  - Adding $jsfile to index.html (before <head>)"
        sed -i "/<head>/i <script type='text/javascript' src='$jsfile'></script>" "$LOCAL_TEMP_DIR/index.html"
    fi
done

# === Insert opencc-js CDN script if not already present ===
OPENCC_SCRIPT='<script src="https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/cn2t.js"></script>'
if grep -Fq "$OPENCC_SCRIPT" "$LOCAL_TEMP_DIR/index.html"; then
    echo "  - Skipping OpenCC script (already included)"
else
    echo "  - Inserting OpenCC script before <head>"
    sed -i "/<head>/i $OPENCC_SCRIPT" "$LOCAL_TEMP_DIR/index.html"
fi

echo "📤 Copying all files in $LOCAL_TEMP_DIR to container..."
docker cp "$LOCAL_TEMP_DIR/." "$CONTAINER_NAME:$CONTAINER_WEB_FOLDER"

echo "✅ Patch complete. Scripts were added if not already present."
